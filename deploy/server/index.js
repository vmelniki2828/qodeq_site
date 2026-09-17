'use strict';

/**
 * QODEQ — contact-api.
 *
 * Заменяет старый index.js (форма старого React-сайта, эндпоинт /api/contact-leads).
 * Новый сайт (QODEQ.dc.html + Product-*.dc.html) шлёт заявки на /api/lead с более
 * богатой схемой (имя, компания, контакт, язык, данные калькулятора).
 *
 * /api/contact-leads оставлен как есть — на случай, если на него ещё что-то ссылается.
 *
 * Настройки — в server/.env (тот же файл, что уже стоит на проде, ничего в нём
 * менять не нужно — переменные совместимы 1:1).
 */

require('dotenv').config();

const dns = require('dns');
const express = require('express');
const nodemailer = require('nodemailer');

const PORT = Number(process.env.PORT || 3001);
const NOTIFY_EMAIL = (process.env.NOTIFY_EMAIL || '').trim();
const SMTP_FROM = (process.env.SMTP_FROM || NOTIFY_EMAIL).trim();
const MAIL_SUBJECT_PREFIX = (process.env.MAIL_SUBJECT_PREFIX || '[Сайт] Заявка').trim();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const AUTOREPLY_ON = String(process.env.AUTOREPLY || '').toLowerCase() === 'true';

// В Docker иногда ломается SMTP по IPv6 — при проблемах поставьте true в server/.env
if (String(process.env.SMTP_IPV4_FIRST || '').toLowerCase() === 'true') {
  dns.setDefaultResultOrder('ipv4first');
}

function buildTransporter() {
  const host = (process.env.SMTP_HOST || '').trim();
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  const secureEnv = String(process.env.SMTP_SECURE || '').trim().toLowerCase();
  let secure = secureEnv === 'true';
  if (secureEnv === '' && port === 465) secure = true;

  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  const tls = {};
  if (String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'false') {
    tls.rejectUnauthorized = false;
  }
  const smtpDebug = String(process.env.SMTP_DEBUG || '').toLowerCase() === 'true';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
    requireTLS: port === 587 && !secure,
    ...(Object.keys(tls).length ? { tls } : {}),
    logger: smtpDebug,
    debug: smtpDebug,
  });
}

const transporter = buildTransporter();
if (transporter) {
  transporter.verify()
    .then(() => console.log(`SMTP OK — ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`))
    .catch((err) => console.error('SMTP не отвечает (письма уходить не будут):', err.message));
} else {
  console.error('SMTP_HOST не задан в server/.env — письма отправляться не будут');
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));

// простой лимит частоты: не больше 8 заявок за 15 минут с одного IP (общий на оба эндпоинта)
const hits = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX = 8;
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX;
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n) => (Number.isFinite(+n) ? '$' + Math.round(+n).toLocaleString('en-US') : '—');
const num = (n) => (Number.isFinite(+n) ? Math.round(+n).toLocaleString('en-US') : '—');
const looksLikeEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

async function notifyTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    });
  } catch (err) {
    console.error('Telegram:', err.message);
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------- новый эндпоинт: форма QODEQ.dc.html / Product-*.dc.html ----------
function buildLeadRows(body) {
  const c = body.calc || {};
  const rows = [
    ['Имя', body.name],
    ['Компания', body.company || '—'],
    ['Контакт', body.contact],
    ['Интересует продукт', body.product || c.product || '—'],
    ['Язык страницы', body.lang === 'ru' ? 'RU' : 'EN'],
  ];
  if (c.chatsPerMonth != null) {
    rows.push(
      ['—', '—'],
      ['Чатов в месяц', num(c.chatsPerMonth)],
      ['Уровень автоматизации', c.automationPct != null ? c.automationPct + '%' : '—'],
      ['Платёжных тикетов в месяц', c.paymentTickets ? num(c.paymentTickets) : 'выкл'],
      ['Минут голоса в месяц', c.voiceMinutes ? num(c.voiceMinutes) : 'выкл'],
      ['QA чатов (100%)', c.qa ? 'включено' : 'выключено'],
      ['Тарифный план', c.plan || '—'],
      ['—', '—'],
      ['Стоимость без AI / мес', money(c.costWithout)],
      ['Стоимость с QODEQ / мес', money(c.costWith)],
      ['Экономия в месяц', money(c.savingMonthly)],
      ['Экономия в год', money(c.savingAnnual)],
      ['Окупаемость внедрения', c.payback || '—'],
      ['Setup fee (оценка)', money(c.setupFees)],
    );
  }
  return rows;
}

function renderLeadText(body, meta) {
  const rows = buildLeadRows(body).map(([k, v]) => (k === '—' ? '' : `${k}: ${v}`)).join('\n');
  return `Новая заявка с сайта QODEQ\n\n${rows}\n\n---\nСтраница: ${meta.page}\nIP: ${meta.ip}\nUA: ${meta.ua}\nВремя: ${meta.time}`;
}

function renderLeadHtml(body, meta) {
  const rows = buildLeadRows(body).map(([k, v]) => {
    if (k === '—') return '<tr><td colspan="2" style="border-top:1px solid #e5e5e5;padding:4px 0"></td></tr>';
    return `<tr><td style="padding:6px 14px 6px 0;color:#666;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#111;font-weight:600">${esc(v)}</td></tr>`;
  }).join('');
  return `<div style="font:14px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111">
  <h2 style="margin:0 0 16px;font-size:18px">Новая заявка с сайта QODEQ</h2>
  <table style="border-collapse:collapse">${rows}</table>
  <p style="margin:18px 0 0;font-size:12px;color:#999">
    Страница: ${esc(meta.page)}<br>IP: ${esc(meta.ip)} · ${esc(meta.ua)}<br>Время: ${esc(meta.time)}
  </p>
</div>`;
}

app.post('/api/lead', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const b = req.body || {};

  if (b.hp) return res.json({ ok: true }); // honeypot: тихо "успех" для ботов

  const name = String(b.name || '').trim().slice(0, 200);
  const company = String(b.company || '').trim().slice(0, 200);
  const contact = String(b.contact || '').trim().slice(0, 200);

  if (!name || !contact) {
    return res.status(400).json({ ok: false, error: 'name and contact are required' });
  }
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'too many requests' });
  }
  if (!NOTIFY_EMAIL || !transporter) {
    console.error('Lead form: NOTIFY_EMAIL/SMTP не настроены в server/.env');
    return res.status(500).json({ ok: false, error: 'server mail not configured' });
  }

  const meta = {
    page: String(b.page || '').slice(0, 300) || '—',
    ip,
    ua: String(req.get('user-agent') || '—').slice(0, 300),
    time: new Date().toISOString(),
  };
  const product = String(b.product || (b.calc && b.calc.product) || '').trim().slice(0, 120);
  const payload = { name, company, contact, product, lang: b.lang, calc: b.calc || {} };
  const subject = `${MAIL_SUBJECT_PREFIX}: ${name}${company ? ' — ' + company : ''}${product ? ' · ' + product : ''}`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: NOTIFY_EMAIL,
      replyTo: looksLikeEmail(contact) ? contact : undefined,
      subject,
      text: renderLeadText(payload, meta),
      html: renderLeadHtml(payload, meta),
    });

    notifyTelegram(renderLeadText(payload, meta));

    if (AUTOREPLY_ON && looksLikeEmail(contact)) {
      transporter.sendMail({
        from: SMTP_FROM,
        to: contact,
        subject: 'QODEQ — заявка получена',
        text: `Здравствуйте, ${name}!\n\nМы получили вашу заявку и свяжемся в течение одного рабочего дня.\nК ответу приложим персональный расчёт по вашим объёмам.\n\n— Команда QODEQ\n${NOTIFY_EMAIL}`,
      }).catch((err) => console.error('Автоответ:', err.message));
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Отправка письма (/api/lead) не удалась:', err.message);
    return res.status(502).json({ ok: false, error: 'mail delivery failed' });
  }
});

// ---------- старый эндпоинт: форма прежнего React-сайта (оставлен для совместимости) ----------
app.post('/api/contact-leads', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { contact, consent, timestamp, page, product } = req.body || {};

  if (typeof contact !== 'string' || !contact.trim()) {
    return res.status(400).json({ error: 'contact required' });
  }
  if (consent !== true) {
    return res.status(400).json({ error: 'consent required' });
  }
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'too many requests' });
  }
  if (!NOTIFY_EMAIL || !transporter) {
    console.error('contact-leads: NOTIFY_EMAIL/SMTP не настроены в server/.env');
    return res.status(500).json({ error: 'server mail not configured' });
  }

  const subject = `${MAIL_SUBJECT_PREFIX} — ${typeof page === 'string' ? page : 'форма'}`;
  const lines = [
    `Контакт: ${contact.trim()}`,
    `Страница: ${page ?? '—'}`,
    product ? `Продукт: ${product}` : null,
    `Время: ${timestamp ?? '—'}`,
    `Согласие: да`,
  ].filter(Boolean);

  try {
    await transporter.sendMail({ from: SMTP_FROM, to: NOTIFY_EMAIL, subject, text: lines.join('\n') });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Отправка письма (/api/contact-leads) не удалась:', err.message);
    return res.status(500).json({ error: 'mail send failed' });
  }
});

// ---------- live chat proxy (внутреннее API Website-инбокса Chatwoot) ----------
// Браузер не может звать chat-platform.qodeq.net напрямую (там нет CORS для
// внутреннего /api/v1/widget/*), поэтому мы проксируем через свой же бэкенд —
// это же позволяет рисовать сообщения в своей вёрстке, а не в чужом iframe.
const CW_BASE = 'https://chat-platform.qodeq.net';
// У каждой страницы — свой инбокс в Chatwoot (иначе переписка с одной страницы
// подмешивалась в другую). 'qchat' — главная, 'pchat' — /chat.
const CW_WEBSITE_TOKENS = {
  qchat: 'nVPeVNBKizF54kNGseMcTY14',
  pchat: 'oicEJz7wp9tfAKeuLKTiwv3c',
};
function cwToken(surface) {
  return CW_WEBSITE_TOKENS[surface] || CW_WEBSITE_TOKENS.qchat;
}

const lcHits = new Map();
const LC_WINDOW = 60 * 1000;
// Поллинг сам по себе даёт ~15 запросов/мин на одну открытую вкладку (раз в 4 сек) —
// при паре вкладок и активной переписке лимит в 40 выбивался и на живом трафике
// (POST падал молча из-за .catch(()=>{}), из-за чего казалось, что сообщение
// "не ушло", и его отправляли повторно). 300/мин на IP всё ещё защищает от абьюза.
const LC_MAX = 300;
function lcRateLimited(ip) {
  const now = Date.now();
  const list = (lcHits.get(ip) || []).filter((t) => now - t < LC_WINDOW);
  list.push(now);
  lcHits.set(ip, list);
  if (lcHits.size > 5000) lcHits.clear();
  return list.length > LC_MAX;
}

app.get('/api/livechat/init', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (lcRateLimited(ip)) return res.status(429).json({ ok: false, error: 'too many requests' });
  const websiteToken = cwToken(String(req.query.surface || ''));
  try {
    const r = await fetch(`${CW_BASE}/widget?website_token=${websiteToken}`);
    const html = await r.text();
    const m = html.match(/authToken = '([^']+)'/);
    if (!m) return res.status(502).json({ ok: false, error: 'no token in response' });
    return res.json({ ok: true, token: m[1] });
  } catch (err) {
    console.error('livechat init:', err.message);
    return res.status(502).json({ ok: false, error: 'init failed' });
  }
});

app.post('/api/livechat/message', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (lcRateLimited(ip)) return res.status(429).json({ ok: false, error: 'too many requests' });
  const token = String((req.body || {}).token || '').trim();
  const content = String((req.body || {}).content || '').trim().slice(0, 2000);
  const websiteToken = cwToken(String((req.body || {}).surface || ''));
  if (!token || !content) return res.status(400).json({ ok: false, error: 'token and content required' });
  try {
    const r = await fetch(`${CW_BASE}/api/v1/widget/messages?website_token=${websiteToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body: JSON.stringify({ content }),
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'send failed' });
    const data = await r.json();
    return res.json({ ok: true, message: data });
  } catch (err) {
    console.error('livechat message:', err.message);
    return res.status(502).json({ ok: false, error: 'send failed' });
  }
});

// Обновляет email контакта в Chatwoot — это и есть "Give the team a way to
// reach you" из штатного виджета Chatwoot, который мы у себя не используем
// (своя вёрстка). Инициирует init() так же лениво, как send(): контакт
// создаётся только когда посетитель реально ввёл и отправил email.
app.post('/api/livechat/contact', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (lcRateLimited(ip)) return res.status(429).json({ ok: false, error: 'too many requests' });
  const token = String((req.body || {}).token || '').trim();
  const email = String((req.body || {}).email || '').trim().slice(0, 200);
  const websiteToken = cwToken(String((req.body || {}).surface || ''));
  if (!token || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'token and valid email required' });
  }
  try {
    const r = await fetch(`${CW_BASE}/api/v1/widget/contact?website_token=${websiteToken}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body: JSON.stringify({ email }),
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'update failed' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('livechat contact:', err.message);
    return res.status(502).json({ ok: false, error: 'update failed' });
  }
});

app.get('/api/livechat/messages', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (lcRateLimited(ip)) return res.status(429).json({ ok: false, error: 'too many requests' });
  const token = String(req.get('X-Auth-Token') || req.query.token || '').trim();
  const websiteToken = cwToken(String(req.query.surface || ''));
  if (!token) return res.status(400).json({ ok: false, error: 'token required' });
  try {
    const r = await fetch(`${CW_BASE}/api/v1/widget/messages?website_token=${websiteToken}`, {
      headers: { 'X-Auth-Token': token },
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'fetch failed' });
    const data = await r.json();
    return res.json({ ok: true, messages: data.payload || [] });
  } catch (err) {
    console.error('livechat messages:', err.message);
    return res.status(502).json({ ok: false, error: 'fetch failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`QODEQ contact-api listening on http://0.0.0.0:${PORT}`);
  console.log(`Заявки на: ${NOTIFY_EMAIL || '(не задано)'}`);
});
