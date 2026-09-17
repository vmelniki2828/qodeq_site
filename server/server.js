'use strict';

/**
 * QODEQ — сервер формы обратной связи.
 *
 * Что делает:
 *   1. Отдаёт статику сайта (index.html, *.dc.html, *.js) из папки на уровень выше.
 *   2. Принимает POST /api/lead с данными формы и расчётом калькулятора,
 *      отправляет письмо на NOTIFY_EMAIL через SMTP (nodemailer).
 *   3. Опционально дублирует заявку в Telegram и шлёт автоответ клиенту.
 *
 * Настройки — в файле server/.env (см. .env.example).
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

// ---------- конфигурация ----------
const {
  NOTIFY_EMAIL,
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PORT = '587',
  SMTP_SECURE = 'false',
  SMTP_USER,
  SMTP_PASS,
  MAIL_SUBJECT_PREFIX = '[Сайт] Заявка',
  PORT = '3001',
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  AUTOREPLY = 'false',
  SITE_DIR,
} = process.env;

const required = { NOTIFY_EMAIL, SMTP_HOST, SMTP_USER, SMTP_PASS };
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error('Не заданы обязательные переменные в server/.env: ' + missing.join(', '));
  process.exit(1);
}

const FROM = SMTP_FROM || `QODEQ <${SMTP_USER}>`;
const STATIC_DIR = SITE_DIR ? path.resolve(SITE_DIR) : path.join(__dirname, '..');
const AUTOREPLY_ON = String(AUTOREPLY).toLowerCase() === 'true';

// ---------- SMTP ----------
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: String(SMTP_SECURE).toLowerCase() === 'true', // true = 465, false = 587 (STARTTLS)
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

transporter.verify()
  .then(() => console.log(`SMTP OK — ${SMTP_HOST}:${SMTP_PORT}, отправитель ${SMTP_USER}`))
  .catch((err) => console.error('SMTP не отвечает (письма уходить не будут):', err.message));

// ---------- приложение ----------
const app = express();
app.set('trust proxy', 1); // за nginx/Cloudflare — чтобы видеть реальный IP
app.use(express.json({ limit: '24kb' }));

// не отдавать наружу серверную папку и служебные файлы
app.use((req, res, next) => {
  if (/^\/(server(\/|$)|node_modules|asd\.txt|\.env)/i.test(req.path)) return res.status(404).end();
  next();
});

// простой лимит частоты: не больше 5 заявок за 15 минут с одного IP
const hits = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX = 5;
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX;
}

// ---------- утилиты форматирования ----------
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n) => (Number.isFinite(+n) ? '$' + Math.round(+n).toLocaleString('en-US') : '—');
const num = (n) => (Number.isFinite(+n) ? Math.round(+n).toLocaleString('en-US') : '—');
const looksLikeEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

function buildRows(body) {
  const c = body.calc || {};
  const rows = [
    ['Имя', body.name],
    ['Компания', body.company || '—'],
    ['Контакт', body.contact],
    ['Интересует продукт', body.product || c.product || '—'],
    ['Язык страницы', body.lang === 'ru' ? 'RU' : 'EN'],
  ];
  // блок калькулятора — только если заявка пришла со страницы с расчётом
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

function renderText(body, meta) {
  const rows = buildRows(body)
    .map(([k, v]) => (k === '—' ? '' : `${k}: ${v}`))
    .join('\n');
  return `Новая заявка с сайта QODEQ\n\n${rows}\n\n---\nСтраница: ${meta.page}\nIP: ${meta.ip}\nUA: ${meta.ua}\nВремя: ${meta.time}`;
}

function renderHtml(body, meta) {
  const rows = buildRows(body).map(([k, v]) => {
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

// ---------- эндпоинт формы ----------
app.post('/api/lead', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const b = req.body || {};

  // honeypot: скрытое поле, которое заполняют только боты
  if (b.hp) return res.json({ ok: true });

  const name = String(b.name || '').trim().slice(0, 200);
  const company = String(b.company || '').trim().slice(0, 200);
  const contact = String(b.contact || '').trim().slice(0, 200);

  if (!name || !contact) {
    return res.status(400).json({ ok: false, error: 'name and contact are required' });
  }
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'too many requests' });
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
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: looksLikeEmail(contact) ? contact : undefined,
      subject,
      text: renderText(payload, meta),
      html: renderHtml(payload, meta),
    });

    // необязательные каналы — не должны ломать ответ клиенту
    notifyTelegram(renderText(payload, meta));

    if (AUTOREPLY_ON && looksLikeEmail(contact)) {
      transporter.sendMail({
        from: FROM,
        to: contact,
        subject: 'QODEQ — заявка получена',
        text: `Здравствуйте, ${name}!\n\nМы получили вашу заявку и свяжемся в течение одного рабочего дня.\nК ответу приложим персональный расчёт по вашим объёмам.\n\n— Команда QODEQ\nsupport@qodeq.net · https://t.me/qodeq`,
      }).catch((err) => console.error('Автоответ:', err.message));
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Отправка письма не удалась:', err.message);
    return res.status(502).json({ ok: false, error: 'mail delivery failed' });
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

// health-check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---------- статика сайта ----------
app.use(express.static(STATIC_DIR, {
  dotfiles: 'ignore',
  extensions: ['html'],
  setHeaders: (res, p) => {
    if (p.endsWith('.dc.html') || p.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

app.listen(Number(PORT), () => {
  console.log(`QODEQ lead server — http://localhost:${PORT}`);
  console.log(`Статика из: ${STATIC_DIR}`);
  console.log(`Заявки на: ${NOTIFY_EMAIL}`);
});
