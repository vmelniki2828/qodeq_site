'use strict';

/**
 * QODEQ — Telegram-бот заявок.
 *
 *   • карточка новой заявки в группу с кнопками [✅ Взял] / [🚫 Спам] (и [↩️ Вернуть] после);
 *   • напоминание, если заявку не взяли за ESCALATE_MIN минут рабочего времени;
 *   • утренняя сводка в DIGEST_HOUR по рабочим дням;
 *   • команды: /chatid — показать id чата (для настройки), /leads — открытые заявки.
 *
 * Бот сам опрашивает Telegram (long polling), вебхук и правки nginx не нужны.
 * Один токен — один процесс: если тот же бот запущен ещё где-то с getUpdates,
 * Telegram отвечает 409 и бот ждёт.
 *
 * Если группу превратили в супергруппу, у неё новый chat_id. Бот берёт его из
 * ответа Telegram (migrate_to_chat_id) или из служебного сообщения, переключается
 * сам и запоминает новый id в базе (meta tg_chat_migrated) — TELEGRAM_CHAT_ID
 * в .env стоит потом поправить, но заявки не теряются.
 *
 * Файл общий для server/ и deploy/server/ (копия побайтовая).
 */

const { touchLabel, rowToLead } = require('./lead-store');

const DOW = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n) => (Number.isFinite(+n) ? '$' + Math.round(+n).toLocaleString('en-US') : null);
const short = (n) => (n >= 1000 ? Math.round(n / 1000) + 'K' : String(n));

/** Результат проверки email (email-check.js: статус ZeroBounce или dns_ok) → строка карточки. */
function emailCheckLabel(v) {
  if (!v) return null;
  if (v === 'valid') return '✅ ящик существует (ZeroBounce)';
  if (v === 'dns_ok') return '☑️ домен принимает почту, сам ящик не проверялся';
  if (v.startsWith('catch-all')) return '⚠️ не проверить: почта компании принимает любые адреса';
  if (v === 'do_not_mail/role_based') return '🟡 общий адрес (info@, sales@…), ящик есть';
  if (v.startsWith('unknown')) return '⚠️ не удалось проверить: почтовый сервер не ответил';
  if (v === 'error') return '⚠️ не проверена: сервис проверки недоступен';
  return `⚠️ сомнительная (ZeroBounce: ${v})`;
}

/** "10-19" → [10, 19]; "1-5" → Set{1..5} */
function parseRange(s, def) {
  const m = String(s || '').match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  return m ? [Number(m[1]), Number(m[2])] : def;
}

function createLeadBot(opts) {
  const { token, store, log = console } = opts;
  const envChatId = opts.chatId;
  let chatId = envChatId;
  // переезд группы в супергруппу, запомненный раньше (только для того же TELEGRAM_CHAT_ID)
  if (store && envChatId) {
    try {
      const mig = JSON.parse(store.getMeta('tg_chat_migrated') || 'null');
      if (mig && String(mig.from) === String(envChatId) && mig.to) chatId = String(mig.to);
    } catch (e) { /* нет записи */ }
  }
  const apiBase = (opts.apiBase || 'https://api.telegram.org').replace(/\/$/, '');
  const tz = opts.tz || 'Europe/Kyiv';
  const [workFrom, workTo] = parseRange(opts.workHours, [10, 19]);
  const [dayFrom, dayTo] = parseRange(opts.workDays, [1, 5]);
  const escalateMin = Number(opts.escalateMin || 15);
  const digestHour = opts.digestHour != null && opts.digestHour !== '' ? Number(opts.digestHour) : workFrom;
  const mention = (opts.mention || '').trim();   // например "@sales_lead" — добавляется в напоминание

  const enabled = Boolean(token && chatId);

  // ---------- время в часовом поясе команды ----------
  const partsFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  function local(d) {
    const p = {};
    for (const x of partsFmt.formatToParts(d)) p[x.type] = x.value;
    return { dow: DOW[p.weekday], hour: Number(p.hour), date: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}`, dm: `${p.day}.${p.month}` };
  }
  function isWorking(d) {
    const l = local(d);
    return l.dow >= dayFrom && l.dow <= dayTo && l.hour >= workFrom && l.hour < workTo;
  }
  /** Сколько рабочих минут прошло между from и to (считает не больше cap). */
  function workingMinutes(fromMs, toMs, cap) {
    let n = 0;
    for (let t = fromMs + 60000; t <= toMs && n < cap; t += 60000) if (isWorking(new Date(t))) n++;
    return n;
  }
  const stamp = (iso) => { const l = local(new Date(iso)); return `${l.dm} ${l.hm}`; };

  // ---------- Telegram API ----------
  async function api(method, body) {
    const r = await fetch(`${apiBase}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: AbortSignal.timeout(65000),
    });
    const data = await r.json().catch(() => ({}));
    if (!data.ok) {
      const err = new Error(`${method}: ${data.description || 'HTTP ' + r.status}`);
      err.code = data.error_code || r.status;
      err.migrateTo = data.parameters && data.parameters.migrate_to_chat_id;
      throw err;
    }
    return data.result;
  }

  function migrate(to) {
    if (!to || String(to) === String(chatId)) return;
    log.error(`TG: группа ${chatId} стала супергруппой, переключаюсь на ${to} — поправьте TELEGRAM_CHAT_ID в .env`);
    chatId = String(to);
    if (store) store.setMeta('tg_chat_migrated', JSON.stringify({ from: envChatId, to: chatId, at: new Date().toISOString() }));
  }

  /** Сообщение в чат заявок; при переезде группы переключается и повторяет один раз. */
  async function send(body) {
    try {
      return await api('sendMessage', { ...body, chat_id: chatId });
    } catch (err) {
      if (!err.migrateTo) throw err;
      migrate(err.migrateTo);
      return api('sendMessage', { ...body, chat_id: chatId });
    }
  }

  // ---------- карточка заявки ----------
  function card(id, lead, meta, row) {
    const c = lead.calc || {};
    const a = lead.attrib || {};
    const lines = [];
    lines.push(`🟡 <b>Заявка${id ? ' #' + id : ''}</b>${lead.product ? ' · ' + esc(lead.product) : ''}`);
    lines.push(`<b>${esc(lead.name)}</b>${lead.company ? ' — ' + esc(lead.company) : ''}`);
    lines.push(`📬 ${esc(lead.contact)}`);
    const mailCheck = emailCheckLabel(lead.emailCheck);
    if (mailCheck) lines.push(`📧 Почта: ${esc(mailCheck)}`);
    let page = meta.page || '';
    try { page = new URL(page).pathname; } catch (e) { /* оставляем как есть */ }
    lines.push(`🌐 ${lead.lang === 'ru' ? 'RU' : 'EN'} · ${esc(page || '—')}`);
    const first = touchLabel(a.first), last = touchLabel(a.last);
    if (a.first || a.last) lines.push(`📈 ${esc(first)}${a.last && last !== first ? ' → ' + esc(last) : ''}`);
    if (c.chatsPerMonth != null) {
      const save = money(c.savingMonthly);
      lines.push(`💰 ${short(+c.chatsPerMonth)} чатов/мес${save ? ' · экономия ' + save + '/мес' : ''}${c.plan ? ' · ' + esc(c.plan) : ''}`);
    }
    lines.push(`🕒 ${stamp(meta.time)}`);

    if (row && row.status === 'taken') lines.push('', `✅ <b>Взял: ${esc(row.taken_by)}</b> · ${stamp(row.taken_at)}`);
    if (row && row.status === 'spam') lines.push('', `🚫 <b>Спам</b> · отметил ${esc(row.taken_by)}`);
    return lines.join('\n');
  }

  function keyboard(id, status) {
    if (!id) return undefined;
    if (status === 'taken' || status === 'spam') {
      return { inline_keyboard: [[{ text: '↩️ Вернуть', callback_data: `undo:${id}` }]] };
    }
    return { inline_keyboard: [[
      { text: '✅ Взял', callback_data: `take:${id}` },
      { text: '🚫 Спам', callback_data: `spam:${id}` },
    ]] };
  }

  /** Отправляет карточку новой заявки. Возвращает message_id или бросает ошибку. */
  async function sendLeadCard(id, lead, meta) {
    const msg = await send({
      text: card(id, lead, meta, null),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: keyboard(id, 'new'),
    });
    return msg.message_id;
  }

  /** Короткое сообщение в группу: форма не пропустила адрес. */
  async function sendRejected(info) {
    let page = info.page || '';
    try { page = new URL(page).pathname; } catch (e) { /* оставляем как есть */ }
    const why = info.reason === 'disposable' ? 'временная почта' : 'такого ящика нет';
    const lines = [
      `⛔ <b>Форма не пропустила адрес</b> · ${why}`,
      `${esc(info.name)}${info.company ? ' — ' + esc(info.company) : ''}`,
      `📬 ${esc(info.contact)}${info.suggestion ? ' (подсказали ' + esc(info.suggestion) + ')' : ''}`,
      `🌐 ${info.lang === 'ru' ? 'RU' : 'EN'} · ${esc(page || '—')}`,
    ];
    return send({ text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true });
  }

  // ---------- кнопки и команды ----------
  const who = (u) => (u.username ? '@' + u.username : [u.first_name, u.last_name].filter(Boolean).join(' ') || String(u.id));

  async function onCallback(cq) {
    const answer = (text) => api('answerCallbackQuery', { callback_query_id: cq.id, text }).catch(() => {});
    if (!cq.message || String(cq.message.chat.id) !== String(chatId)) return answer('Не тот чат');
    const m = String(cq.data || '').match(/^(take|spam|undo):(\d+)$/);
    if (!m || !store) return answer('');
    const id = Number(m[2]);
    const before = store.get(id);
    if (!before) return answer('Заявка не найдена');

    if (m[1] === 'take' || m[1] === 'spam') {
      if (before.status !== 'new') return answer(`Уже: ${before.status === 'taken' ? 'взял ' + before.taken_by : 'спам'}`);
      store.setStatus(id, m[1] === 'take' ? 'taken' : 'spam', who(cq.from));
    } else {
      store.setStatus(id, 'new', null);
    }

    const row = store.get(id);
    const { lead, meta } = rowToLead(row);
    try {
      await api('editMessageText', {
        chat_id: chatId,
        message_id: cq.message.message_id,
        text: card(id, lead, meta, row),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: keyboard(id, row.status),
      });
    } catch (err) {
      if (!/not modified/i.test(err.message)) log.error('TG edit:', err.message);
    }
    return answer(m[1] === 'take' ? 'Заявка ваша' : m[1] === 'spam' ? 'Отмечено как спам' : 'Вернули в работу');
  }

  function openList() {
    const open = store ? store.listOpen() : [];
    if (!open.length) return 'Открытых заявок нет 👌';
    return '📋 <b>Открытые заявки</b>\n' + open.map((r) =>
      `• #${r.id} ${esc(r.name)}${r.company ? ' — ' + esc(r.company) : ''} · ${stamp(r.created_at)}`).join('\n');
  }

  async function onMessage(msg) {
    if (msg.migrate_to_chat_id && String(msg.chat.id) === String(chatId)) return migrate(msg.migrate_to_chat_id);
    const text = String(msg.text || '').trim();
    const cmd = text.split(/[\s@]/)[0].toLowerCase();
    if (cmd === '/chatid') {
      await api('sendMessage', { chat_id: msg.chat.id, text: `chat_id этого чата: ${msg.chat.id}` });
    } else if (cmd === '/leads' && String(msg.chat.id) === String(chatId)) {
      await send({ text: openList(), parse_mode: 'HTML' });
    }
  }

  // ---------- напоминания и сводка ----------
  async function escalate() {
    if (!store) return;
    const now = Date.now();
    if (!isWorking(new Date(now))) return;
    for (const r of store.awaitingEscalation()) {
      const created = Date.parse(r.created_at);
      if (now - created > 3 * 24 * 3600 * 1000) { store.markEscalated(r.id); continue; } // старые — только в сводке
      if (workingMinutes(created, now, escalateMin) < escalateMin) continue;
      store.markEscalated(r.id);
      await send({
        reply_to_message_id: r.tg_message_id,
        allow_sending_without_reply: true,
        text: `⏰ Заявку #${r.id} (${r.name}${r.company ? ', ' + r.company : ''}) никто не взял уже ${escalateMin} мин. Кто берёт?${mention ? ' ' + mention : ''}`,
      }).catch((err) => log.error('TG escalate:', err.message));
    }
  }

  async function digest() {
    if (!store) return;
    const l = local(new Date());
    if (l.dow < dayFrom || l.dow > dayTo || l.hour < digestHour) return;
    if (store.getMeta('digest_date') === l.date) return;
    store.setMeta('digest_date', l.date);

    const since = store.getMeta('digest_at') || new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    store.setMeta('digest_at', new Date().toISOString());
    const fresh = store.createdSince(since);
    const count = (s) => fresh.filter((r) => r.status === s).length;
    const bySource = {};
    for (const r of fresh) {
      let a = {};
      try { a = JSON.parse(r.attrib || '{}'); } catch (e) { /* пусто */ }
      const k = a.first ? touchLabel(a.first).split(' / ')[0] : 'без данных';
      bySource[k] = (bySource[k] || 0) + 1;
    }
    const lines = [`☀️ <b>Сводка заявок</b> с ${esc(stamp(since))}`];
    if (fresh.length) {
      lines.push(`Новых: <b>${fresh.length}</b> · взято ${count('taken')} · спам ${count('spam')} · открыто ${count('new')}`);
      lines.push('Источники: ' + Object.entries(bySource).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${esc(k)} ${v}`).join(' · '));
    } else {
      lines.push('Новых заявок не было.');
    }
    lines.push('', openList());
    await send({ text: lines.join('\n'), parse_mode: 'HTML' })
      .catch((err) => log.error('TG digest:', err.message));
  }

  // ---------- запуск ----------
  let started = false;
  async function pollLoop() {
    let offset = 0;
    for (;;) {
      try {
        const updates = await api('getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'callback_query'] });
        for (const u of updates) {
          offset = u.update_id + 1;
          try {
            if (u.callback_query) await onCallback(u.callback_query);
            else if (u.message) await onMessage(u.message);
          } catch (err) {
            log.error('TG update:', err.message);
          }
        }
      } catch (err) {
        log.error('TG getUpdates:', err.message);
        await new Promise((r) => setTimeout(r, err.code === 409 ? 30000 : 5000));
      }
    }
  }

  function start() {
    if (!token || started) return;
    started = true;
    // первая сводка — на следующее рабочее утро, а не сразу после деплоя
    if (store && !store.getMeta('digest_date')) {
      store.setMeta('digest_date', local(new Date()).date);
      store.setMeta('digest_at', new Date().toISOString());
    }
    pollLoop();
    if (enabled) {
      const timer = setInterval(() => { escalate().then(digest).catch((err) => log.error('TG timer:', err.message)); }, 60 * 1000);
      timer.unref();
      log.log(`TG-бот заявок: чат ${chatId}, рабочее время ${workFrom}–${workTo} (${tz}), дни ${dayFrom}–${dayTo}, напоминание через ${escalateMin} мин, сводка в ${digestHour}:00`);
    } else {
      log.log('TG-бот: TELEGRAM_CHAT_ID не задан — работает только /chatid (добавьте бота в группу и отправьте /chatid)');
    }
  }

  return { enabled, sendLeadCard, sendRejected, start, _test: { card, isWorking, workingMinutes, escalate, digest, onCallback } };
}

module.exports = { createLeadBot };
