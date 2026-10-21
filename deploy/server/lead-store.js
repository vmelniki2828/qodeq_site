'use strict';

/**
 * QODEQ — хранилище заявок (SQLite).
 *
 * Заявка записывается сюда ДО отправки письма и Telegram, поэтому сбой SMTP
 * больше не теряет её: неотправленные уведомления досылаются по таймеру.
 *
 * Файл общий для server/server.js (локально) и deploy/server/index.js (прод):
 * копия в deploy/server/lead-store.js должна быть побайтовой.
 *
 * База: LEADS_DB из .env или data/leads.db рядом с сервером
 * (в Docker это /app/data/leads.db, папка смонтирована volume-ом).
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const MAX_ATTEMPTS = 8;          // столько раз пытаемся доставить уведомление
const RETRY_EVERY_MS = 2 * 60 * 1000;
const RETRY_WINDOW_H = 72;       // старше — не досылаем, только лог

// ---------- атрибуция (что прислал attrib.js) ----------
const TOUCH_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'gclid', 'fbclid', 'yclid', 'referrer', 'landing', 'ts'];

function cleanTouch(t) {
  if (!t || typeof t !== 'object') return null;
  const out = {};
  for (const k of TOUCH_FIELDS) {
    if (t[k] != null && t[k] !== '') out[k] = String(t[k]).slice(0, 300);
  }
  return Object.keys(out).length ? out : null;
}

/** { first, last } из тела запроса → только известные поля, обрезанные по длине. */
function normalizeAttrib(raw) {
  if (!raw || typeof raw !== 'object') return { first: null, last: null };
  return { first: cleanTouch(raw.first), last: cleanTouch(raw.last) };
}

/** Короткая подпись касания: "linkedin / social / sigma-rome" или "referral: t.me" или "direct". */
function touchLabel(t) {
  if (!t) return '—';
  if (t.utm_source) return [t.utm_source, t.utm_medium, t.utm_campaign].filter(Boolean).join(' / ');
  if (t.gclid) return 'google ads (gclid)';
  if (t.referrer) {
    try { return 'referral: ' + new URL(t.referrer).hostname; } catch (e) { return 'referral'; }
  }
  return 'direct';
}

/** Строки для письма/TG в формате buildRows: [['Источник', '...'], ...]. */
function attribRows(attrib) {
  const { first, last } = attrib || {};
  if (!first && !last) return [];
  const rows = [['—', '—'], ['Источник (первый визит)', touchLabel(first)]];
  if (last && touchLabel(last) !== touchLabel(first)) rows.push(['Источник (последний)', touchLabel(last)]);
  if (first && first.landing) rows.push(['Страница входа', first.landing]);
  if (first && first.ts) rows.push(['Первый визит', first.ts.slice(0, 16).replace('T', ' ') + ' UTC']);
  return rows;
}

/**
 * Язык заявки = язык сайта, на котором её оставили: то, что прислала форма ('ru' / 'en'),
 * а если форма не прислала — по адресу страницы (/ru/… → ru). Всё остальное — en.
 */
function pickLang(lang, page) {
  const l = String(lang || '').toLowerCase();
  if (l === 'ru' || l === 'en') return l;
  try { return /^\/ru(\/|$)/.test(new URL(String(page)).pathname) ? 'ru' : 'en'; } catch (e) { return 'en'; }
}

// ---------- база ----------
function openLeadStore(file) {
  const dbFile = file || process.env.LEADS_DB || path.join(__dirname, 'data', 'leads.db');
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  const db = new Database(dbFile);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at    TEXT NOT NULL,
      name          TEXT,
      company       TEXT,
      contact       TEXT,
      product       TEXT,
      lang          TEXT,
      page          TEXT,
      ip            TEXT,
      ua            TEXT,
      -- первое касание, развёрнуто для удобных выборок; оба касания целиком — в attrib
      utm_source    TEXT,
      utm_medium    TEXT,
      utm_campaign  TEXT,
      utm_content   TEXT,
      utm_term      TEXT,
      referrer      TEXT,
      landing       TEXT,
      attrib        TEXT,
      calc          TEXT,
      status        TEXT NOT NULL DEFAULT 'new',   -- new / taken / spam (кнопки в TG — шаг 0.3)
      mail_sent_at  TEXT,
      tg_sent_at    TEXT,
      attempts      INTEGER NOT NULL DEFAULT 0,
      last_error    TEXT
    );
    CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at);
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
  `);
  // колонки для TG-бота (шаг 0.3); на уже созданной базе добавляются миграцией
  const have = new Set(db.prepare(`PRAGMA table_info(leads)`).all().map((c) => c.name));
  for (const [col, type] of [['tg_message_id', 'INTEGER'], ['taken_by', 'TEXT'], ['taken_at', 'TEXT'], ['escalated_at', 'TEXT']]) {
    if (!have.has(col)) db.exec(`ALTER TABLE leads ADD COLUMN ${col} ${type}`);
  }

  const insertStmt = db.prepare(`
    INSERT INTO leads (created_at, name, company, contact, product, lang, page, ip, ua,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing, attrib, calc)
    VALUES (@created_at, @name, @company, @contact, @product, @lang, @page, @ip, @ua,
      @utm_source, @utm_medium, @utm_campaign, @utm_content, @utm_term, @referrer, @landing, @attrib, @calc)
  `);

  return {
    file: dbFile,

    /** Сохраняет заявку, возвращает id. */
    insert(lead, meta) {
      const f = (lead.attrib && lead.attrib.first) || {};
      return Number(insertStmt.run({
        created_at: meta.time,
        name: lead.name,
        company: lead.company || null,
        contact: lead.contact,
        product: lead.product || null,
        lang: lead.lang === 'ru' ? 'ru' : 'en',
        page: meta.page,
        ip: meta.ip,
        ua: meta.ua,
        utm_source: f.utm_source || null,
        utm_medium: f.utm_medium || null,
        utm_campaign: f.utm_campaign || null,
        utm_content: f.utm_content || null,
        utm_term: f.utm_term || null,
        referrer: f.referrer || null,
        landing: f.landing || null,
        attrib: JSON.stringify(lead.attrib || {}),
        calc: JSON.stringify(lead.calc || {}),
      }).lastInsertRowid);
    },

    markMailSent(id) {
      db.prepare(`UPDATE leads SET mail_sent_at = ?, last_error = NULL WHERE id = ?`).run(new Date().toISOString(), id);
    },
    markTgSent(id, messageId) {
      db.prepare(`UPDATE leads SET tg_sent_at = ?, tg_message_id = ? WHERE id = ?`)
        .run(new Date().toISOString(), messageId || null, id);
    },

    get(id) {
      return db.prepare(`SELECT * FROM leads WHERE id = ?`).get(id);
    },
    /** status: new / taken / spam; by — кто нажал кнопку в TG. */
    setStatus(id, status, by) {
      const taken = status === 'new' ? null : new Date().toISOString();
      db.prepare(`UPDATE leads SET status = ?, taken_by = ?, taken_at = ? WHERE id = ?`)
        .run(status, status === 'new' ? null : by, taken, id);
    },
    markEscalated(id) {
      db.prepare(`UPDATE leads SET escalated_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
    },
    /** Открытые заявки, по которым карточка уже в TG, но ещё не напоминали. */
    awaitingEscalation() {
      return db.prepare(`
        SELECT * FROM leads
        WHERE status = 'new' AND tg_message_id IS NOT NULL AND escalated_at IS NULL
        ORDER BY id
      `).all();
    },
    listOpen() {
      return db.prepare(`SELECT * FROM leads WHERE status = 'new' ORDER BY id`).all();
    },
    createdSince(iso) {
      return db.prepare(`SELECT * FROM leads WHERE created_at >= ? ORDER BY id`).all(iso);
    },
    getMeta(key) {
      const r = db.prepare(`SELECT value FROM meta WHERE key = ?`).get(key);
      return r ? r.value : null;
    },
    setMeta(key, value) {
      db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, String(value));
    },
    markFailed(id, err) {
      db.prepare(`UPDATE leads SET attempts = attempts + 1, last_error = ? WHERE id = ?`)
        .run(String(err && err.message || err).slice(0, 500), id);
    },

    /**
     * Заявки, по которым письмо (или TG, если он включён) ещё не ушло.
     * Последнюю минуту не берём: эти заявки ещё может отправлять сам обработчик формы,
     * иначе письмо уйдёт дважды.
     */
    pending(withTelegram) {
      const since = new Date(Date.now() - RETRY_WINDOW_H * 3600 * 1000).toISOString();
      const until = new Date(Date.now() - 60 * 1000).toISOString();
      return db.prepare(`
        SELECT * FROM leads
        WHERE created_at >= ? AND created_at <= ? AND attempts < ?
          AND (mail_sent_at IS NULL ${withTelegram ? 'OR tg_sent_at IS NULL' : ''})
        ORDER BY id
      `).all(since, until, MAX_ATTEMPTS);
    },
  };
}

/** Строка из базы → объект в том виде, в каком его ждёт отправка уведомлений. */
function rowToLead(r) {
  const parse = (s) => { try { return JSON.parse(s) || {}; } catch (e) { return {}; } };
  return {
    lead: {
      name: r.name, company: r.company || '', contact: r.contact, product: r.product || '',
      lang: r.lang, calc: parse(r.calc), attrib: parse(r.attrib),
    },
    meta: { page: r.page, ip: r.ip, ua: r.ua, time: r.created_at },
  };
}

/**
 * Периодически досылает уведомления по сохранённым заявкам.
 * deliver(id, lead, meta, row) должен сам отметить успех/ошибку в базе.
 */
function startRetry(store, deliver, withTelegram) {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      for (const row of store.pending(withTelegram)) {
        const { lead, meta } = rowToLead(row);
        await deliver(row.id, lead, meta, row);
      }
    } catch (err) {
      console.error('Повтор отправки заявок:', err.message);
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(tick, RETRY_EVERY_MS);
  timer.unref();
  return timer;
}

module.exports = { openLeadStore, normalizeAttrib, attribRows, touchLabel, startRetry, rowToLead, pickLang };
