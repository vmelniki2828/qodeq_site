'use strict';

/**
 * QODEQ — автоответ клиенту на заявку с сайта (RU/EN по языку страницы).
 *
 * Стиль — как в TG-баннерах и на qodeq.net: тёмный фон #08090B, золото #E8B23A,
 * острые углы, моно-подписи капсом. Вёрстка таблицами и inline-стилями —
 * иначе Gmail/Outlook ломают раскладку. SVG почтовики не показывают,
 * поэтому логотип — PNG с сайта.
 *
 * Файл общий для server/ и deploy/server/ (копия побайтовая).
 */

const SITE = 'https://qodeq.net';
const LOGO = SITE + '/assets/brand/logo-main.png';   // 941×256, светлый текст на прозрачном фоне

// Блок про SiGMA (2–5 ноября) виден по 5 ноября включительно и с 6.11 00:00 по Риму
// пропадает сам. После выставки удалить SIGMA_UNTIL, sigma* в T и sigmaBlock.
const SIGMA_UNTIL = Date.parse('2026-11-06T00:00:00+01:00');

// Агенты внизу письма: цвета продуктов — из бренд-гайда, цифры — с продуктовых страниц сайта
const AGENTS = [
  { path: '/chat', color: '#4FD1A5', name: 'AI Chat Operator',
    en: '65% of chats resolved without a human · 7-second replies',
    ru: '65% чатов решается без человека · ответ за 7 секунд' },
  { path: '/qa-chat', color: '#E8B23A', name: 'AI QA System',
    en: '100% of chats scored on 15 criteria, in real time',
    ru: '100% чатов по 15 критериям в реальном времени' },
  { path: '/payment', color: '#5FA5F9', name: 'AI Payment Assistant',
    en: '“Where is my deposit?” answered in 10 seconds',
    ru: '«Где мой депозит?» — ответ за 10 секунд' },
  { path: '/qa-call', color: '#C084F5', name: 'AI Voice QA',
    en: 'Every call scored: 100% coverage instead of 2.6%',
    ru: 'Оценка каждого звонка: 100% вместо выборки 2,6%' },
  { path: '/voice', color: '#F4794C', name: 'AI Voice Agent',
    en: '24/7 outbound calls in multiple languages, on script',
    ru: 'Исходящий обзвон 24/7 на нескольких языках по скрипту' },
];

const C = {
  bg: '#08090B', card: '#0E1013', raised: '#15181D', deep: '#0B0C0F', line: '#23262B', text: '#F2F3F5',
  muted: '#A9ADB4', dim: '#84888F', gold: '#E8B23A',
};
const SANS = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', Menlo, Consolas, monospace";

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => (Number.isFinite(+n) ? '$' + Math.round(+n).toLocaleString('en-US') : '—');
const num = (n) => (Number.isFinite(+n) ? Math.round(+n).toLocaleString('en-US') : '—');

const T = {
  en: {
    subject: 'QODEQ — we have your request',
    preheader: 'We will reply within one business day.',
    kicker: 'REQUEST RECEIVED',
    hello: (n) => `Thanks, ${n}.`,
    body: 'Your request is with our team. We will get back to you within one business day with a tailored estimate for your volumes.',
    estimate: 'YOUR ESTIMATE FROM THE WEBSITE',
    rows: {
      chats: 'Chats / month', autom: 'Automation', without: 'Support cost without AI / mo',
      with: 'With QODEQ / mo', save: 'Savings / month', year: 'Savings / year', payback: 'Payback',
    },
    note: 'Indicative numbers from the calculator. We will confirm them on a call.',
    cta: 'Book a 20-min call',
    replyHint: 'Questions? Just reply to this email, it goes straight to our team.',
    sigmaKicker: 'MEET US IN ROME',
    sigmaTitle: 'SiGMA World 2026',
    sigmaText: 'No booth, just meetings. Reply to this email or tap the button and we will find a slot that works for you.',
    sigmaDates: ['2–5', 'NOV'],
    sigmaVenue: 'FIERA ROMA',
    sigmaCta: 'Book a meeting',
    sigmaSubject: 'Meeting at SiGMA Rome',
    agentsKicker: '5 AI AGENTS · ONE PLATFORM',
    footer: 'AI platform for iGaming support',
  },
  ru: {
    subject: 'QODEQ — заявка получена',
    preheader: 'Ответим в течение одного рабочего дня.',
    kicker: 'ЗАЯВКА ПОЛУЧЕНА',
    hello: (n) => `Спасибо, ${n}.`,
    body: 'Заявка уже у команды. Ответим в течение одного рабочего дня и пришлём расчёт под ваши объёмы.',
    estimate: 'ВАШ РАСЧЁТ С САЙТА',
    rows: {
      chats: 'Чатов в месяц', autom: 'Автоматизация', without: 'Саппорт без AI / мес',
      with: 'С QODEQ / мес', save: 'Экономия в месяц', year: 'Экономия в год', payback: 'Окупаемость',
    },
    note: 'Ориентировочные цифры калькулятора. Точный расчёт подтвердим на созвоне.',
    cta: 'Записаться на 20-минутный созвон',
    replyHint: 'Есть вопросы? Просто ответьте на это письмо, оно придёт команде.',
    sigmaKicker: 'ВСТРЕТИМСЯ В РИМЕ',
    sigmaTitle: 'SiGMA World 2026',
    sigmaText: 'Без стенда, только встречи. Ответьте на письмо или нажмите кнопку, и подберём удобное время.',
    sigmaDates: ['2–5', 'НОЯ'],
    sigmaVenue: 'FIERA ROMA',
    sigmaCta: 'Назначить встречу',
    sigmaSubject: 'Встреча на SiGMA в Риме',
    agentsKicker: '5 AI-АГЕНТОВ · ОДНА ПЛАТФОРМА',
    footer: 'AI-платформа для саппорта iGaming',
  },
};

/**
 * lead: { name, lang, calc }
 * opts: { calendarUrl, salesEmail, now }
 * → { subject, text, html }
 */
function buildAutoreply(lead, opts = {}) {
  const ru = lead.lang === 'ru';
  const t = T[ru ? 'ru' : 'en'];
  const c = lead.calc || {};
  const hasCalc = c.chatsPerMonth != null;
  const showSigma = (opts.now || Date.now()) < SIGMA_UNTIL;
  const cal = opts.calendarUrl ? String(opts.calendarUrl) : '';
  const sales = opts.salesEmail || 'sales@qodeq.net';
  const sigmaMailto = `mailto:${sales}?subject=${encodeURIComponent(t.sigmaSubject)}`;
  const agentUrl = (a) => SITE + (ru ? '/ru' : '') + a.path;
  const name = String(lead.name || '').split(/\s+/)[0] || lead.name;

  const calcRows = hasCalc ? [
    [t.rows.chats, num(c.chatsPerMonth)],
    [t.rows.autom, c.automationPct != null ? c.automationPct + '%' : '—'],
    [t.rows.without, money(c.costWithout)],
    [t.rows.with, money(c.costWith)],
    [t.rows.save, money(c.savingMonthly), true],
    [t.rows.year, money(c.savingAnnual)],
    [t.rows.payback, c.payback || '—'],
  ] : [];

  // ---------- текст ----------
  const text = [
    t.hello(name), '',
    t.body, '',
    hasCalc ? t.estimate + '\n' + calcRows.map(([k, v]) => `  ${k}: ${v}`).join('\n') + '\n' + t.note + '\n' : null,
    cal ? `${t.cta}: ${cal}\n` : null,
    showSigma ? `${t.sigmaTitle} · ${t.sigmaDates.join(' ')} · ${t.sigmaVenue}\n${t.sigmaText}\n` : null,
    t.replyHint, '',
    t.agentsKicker,
    ...AGENTS.map((a) => `  ${a.name} — ${ru ? a.ru : a.en}\n  ${agentUrl(a)}`), '',
    '— QODEQ', `${SITE} · https://t.me/qodeq`,
  ].filter((x) => x != null).join('\n');

  // ---------- HTML ----------
  const kicker = (s) => `<div style="font:500 11px/1 ${MONO};letter-spacing:.14em;color:${C.gold};text-transform:uppercase;">${s}</div>`;

  const calcBlock = hasCalc ? `
    <tr><td class="q-px" style="padding:0 40px 32px;">
      ${kicker(t.estimate)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;border-top:1px solid ${C.line};">
        ${calcRows.map(([k, v, hl]) => `
        <tr>
          <td style="padding:11px 0;border-bottom:1px solid ${C.line};font:400 14px/1.4 ${SANS};color:${C.muted};">${esc(k)}</td>
          <td align="right" style="padding:11px 0;border-bottom:1px solid ${C.line};font:${hl ? '700 20px' : '500 14px'}/1.2 ${MONO};color:${hl ? C.gold : C.text};white-space:nowrap;">${esc(v)}</td>
        </tr>`).join('')}
      </table>
      <div style="margin-top:10px;font:400 12px/1.5 ${SANS};color:${C.dim};">${t.note}</div>
    </td></tr>` : '';

  const ctaBlock = cal ? `
    <tr><td class="q-px" style="padding:0 40px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td bgcolor="${C.gold}" style="background:${C.gold};">
          <a href="${esc(cal)}" style="display:inline-block;padding:16px 24px;font:600 12px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${C.bg};text-decoration:none;">${t.cta}&nbsp;&nbsp;→</a>
        </td>
      </tr></table>
    </td></tr>` : '';

  // карточка SiGMA: золотая линия сверху, справа — плашка с датами
  const sigmaBlock = showSigma ? `
    <tr><td class="q-px" style="padding:0 40px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.raised}" style="background:${C.raised};border:1px solid ${C.line};border-top:2px solid ${C.gold};">
        <tr>
          <td valign="top" style="padding:24px 18px 24px 24px;">
            ${kicker(t.sigmaKicker)}
            <div style="margin-top:12px;font:700 22px/1.2 ${SANS};color:${C.text};">${t.sigmaTitle}</div>
            <div class="q-mob" style="display:none;max-height:0;overflow:hidden;margin-top:8px;font:600 12px/1.4 ${MONO};letter-spacing:.14em;color:${C.gold};">${t.sigmaDates.join(' ')} · ${t.sigmaVenue}</div>
            <div style="margin-top:8px;font:400 14px/1.55 ${SANS};color:${C.muted};">${t.sigmaText}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr>
              <td style="border:1px solid ${C.gold};">
                <a href="${esc(sigmaMailto)}" style="display:inline-block;padding:12px 18px;font:600 11px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${C.gold};text-decoration:none;">${t.sigmaCta}&nbsp;&nbsp;→</a>
              </td>
            </tr></table>
          </td>
          <td class="q-hide-mob" valign="top" width="96" style="width:96px;padding:24px 24px 24px 0;">
            <table role="presentation" width="96" cellpadding="0" cellspacing="0" border="0" style="width:96px;border:1px solid ${C.gold};"><tr>
              <td align="center" style="padding:16px 4px 14px;">
                <div style="font:700 26px/1 ${MONO};color:${C.gold};white-space:nowrap;">${t.sigmaDates[0]}</div>
                <div style="margin-top:8px;font:600 12px/1 ${MONO};letter-spacing:.24em;color:${C.text};">${t.sigmaDates[1]}</div>
                <div style="margin:12px 10px 0;padding-top:10px;border-top:1px solid ${C.line};font:500 9px/1.4 ${MONO};letter-spacing:.16em;color:${C.dim};">${t.sigmaVenue.replace(' ', '<br>')}</div>
              </td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td></tr>` : '';

  // агенты: цветная полоска продукта, название, ключевая цифра, ссылка на страницу продукта
  const agentsBlock = `
    <tr><td class="q-px" bgcolor="${C.deep}" style="background:${C.deep};padding:32px 40px 24px;border-top:1px solid ${C.line};">
      ${kicker(t.agentsKicker)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        ${AGENTS.map((a) => `
        <tr>
          <td width="3" bgcolor="${a.color}" style="width:3px;background:${a.color};font-size:0;line-height:0;">&nbsp;</td>
          <td bgcolor="${C.raised}" style="background:${C.raised};padding:13px 12px 13px 16px;">
            <a href="${agentUrl(a)}" style="text-decoration:none;">
              <span style="display:block;font:600 15px/1.3 ${SANS};color:${C.text};">${a.name}</span>
              <span style="display:block;margin-top:3px;font:400 13px/1.45 ${SANS};color:${C.dim};">${esc(ru ? a.ru : a.en)}</span>
            </a>
          </td>
          <td bgcolor="${C.raised}" align="right" valign="middle" style="background:${C.raised};padding:0 16px 0 4px;">
            <a href="${agentUrl(a)}" style="font:600 16px/1 ${MONO};color:${a.color};text-decoration:none;">→</a>
          </td>
        </tr>
        <tr><td colspan="3" height="8" style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`).join('')}
      </table>
    </td></tr>`;

  const html = `<!doctype html>
<html lang="${lead.lang === 'ru' ? 'ru' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(t.subject)}</title>
<style>
  /* узкий экран (Gmail app, Apple Mail): меньше поля, даты выставки строкой вместо плашки */
  @media (max-width: 480px) {
    .q-px { padding-left: 24px !important; padding-right: 24px !important; }
    .q-hide-mob { display: none !important; }
    .q-mob { display: block !important; max-height: none !important; overflow: visible !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};">${esc(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="width:100%;max-width:600px;background:${C.card};border:1px solid ${C.line};">
    <tr><td class="q-px" style="padding:32px 40px 28px;border-bottom:1px solid ${C.line};">
      <a href="${SITE}" style="text-decoration:none;"><img src="${LOGO}" width="132" height="36" alt="QODEQ" style="display:block;border:0;width:132px;height:36px;"></a>
    </td></tr>
    <tr><td class="q-px" style="padding:36px 40px 0;">${kicker(t.kicker)}</td></tr>
    <tr><td class="q-px" style="padding:16px 40px 0;font:700 30px/1.15 ${SANS};color:${C.text};">${esc(t.hello(name))}</td></tr>
    <tr><td class="q-px" style="padding:14px 40px 28px;font:400 16px/1.6 ${SANS};color:${C.muted};">${t.body}</td></tr>
    ${calcBlock}
    ${ctaBlock}
    ${sigmaBlock}
    <tr><td class="q-px" style="padding:0 40px 36px;font:400 14px/1.6 ${SANS};color:${C.muted};">${t.replyHint}</td></tr>
    ${agentsBlock}
    <tr><td class="q-px" bgcolor="${C.deep}" style="background:${C.deep};padding:20px 40px 26px;border-top:1px solid ${C.line};">
      <div style="font:500 11px/1.6 ${MONO};letter-spacing:.12em;color:${C.dim};text-transform:uppercase;">${t.footer}</div>
      <div style="margin-top:8px;font:500 12px/1.6 ${MONO};">
        <a href="${SITE}" style="color:${C.gold};text-decoration:none;">qodeq.net</a>
        <span style="color:${C.line};">&nbsp;&nbsp;/&nbsp;&nbsp;</span>
        <a href="https://t.me/qodeq" style="color:${C.gold};text-decoration:none;">t.me/qodeq</a>
      </div>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: t.subject, text, html };
}

module.exports = { buildAutoreply };
