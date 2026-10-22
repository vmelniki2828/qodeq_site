// Генератор блога /blog/* и /ru/blog/* + обзорной страницы /solutions/ai-customer-support-igaming (SEO / GEO).
// Тексты статей лежат в content/blog/*.js (EN + RU в одном файле), здесь только шаблон.
// Запуск: node build_blog.js  (зависимостей нет)
// Цифры в статьях взяты с продуктовых страниц и pricing.js — при изменении цен/метрик
// обновите их в content/blog/, пересоберите и скопируйте в deploy/public/.
const fs = require('fs');
const path = require('path');

const SITE = 'https://qodeq.net';
const ACC = { chat: '#4FD1A5', 'qa-chat': '#E8B23A', payment: '#5FA5F9', 'qa-call': '#C084F5', voice: '#F4794C' };
const PROD_NAME = { chat: 'AI Chat Operator', 'qa-chat': 'AI QA System', payment: 'AI Payment Assistant', 'qa-call': 'AI Voice QA', voice: 'AI Voice Bot' };

const UI = {
  en: {
    home: '/', prefix: '', locale: 'en_US',
    nav: [['/chat', '01 CHAT', ACC.chat], ['/qa-chat', '02 QA CHAT', ACC['qa-chat']], ['/payment', '03 PAYMENT', ACC.payment], ['/qa-call', '04 QA CALL', ACC['qa-call']], ['/voice', '05 VOICE', ACC.voice], ['/blog', 'BLOG', '#F5F2EC']],
    blog: 'Blog', blogTitle: 'QODEQ Blog — AI Customer Support for iGaming',
    blogDesc: 'Guides on AI customer support for online casinos and sportsbooks: chat automation, payment and withdrawal support, KYC, support QA and voice AI.',
    blogKicker: '— BLOG · AI SUPPORT FOR IGAMING', blogH1: 'Guides to AI customer support in iGaming',
    blogLead: 'How casino and betting operators automate player support, payments, quality control and calls — with real numbers, not hype.',
    updated: 'UPDATED', read: 'MIN READ', by: 'QODEQ TEAM', toc: 'CONTENTS', takeaways: 'KEY TAKEAWAYS',
    faqKicker: '— FAQ', faqTitle: 'Frequently asked questions', product: 'PRODUCT',
    readMore: 'Read →', guides: 'ALL GUIDES', more: 'Learn more →', relatedKicker: '— MORE GUIDES', overview: 'Platform overview',
    ctaPrimary: 'GET A CALCULATION →',
    formKicker: '— REQUEST A CALCULATION', formName: 'Name', formCompany: 'Company', formContact: 'Email or Telegram', formSend: 'SEND REQUEST',
    formNote: 'We reply within one business day. Telegram: @qodeq',
    sending: 'Sending…', sent: 'Thanks! We’ll reply within one business day.', need: 'Please add your name and a contact.',
    fail: 'Could not send. Please message us on Telegram @qodeq.',
    footBack: '← QODEQ · AI PLATFORM FOR IGAMING', footProducts: 'Products', footBlog: 'Guides', footLegal: 'Legal', privacy: 'Privacy Policy',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  ru: {
    home: '/ru/', prefix: '/ru', locale: 'ru_RU',
    nav: [['/ru/chat', '01 ЧАТ', ACC.chat], ['/ru/qa-chat', '02 QA-ЧАТ', ACC['qa-chat']], ['/ru/payment', '03 ПЛАТЕЖИ', ACC.payment], ['/ru/qa-call', '04 QA-ЗВОНКИ', ACC['qa-call']], ['/ru/voice', '05 ГОЛОС', ACC.voice], ['/ru/blog', 'БЛОГ', '#F5F2EC']],
    blog: 'Блог', blogTitle: 'Блог QODEQ — AI-поддержка для iGaming',
    blogDesc: 'Гайды по AI-поддержке для онлайн-казино и букмекеров: автоматизация чатов, платежи и выводы, KYC, контроль качества саппорта и голосовой AI.',
    blogKicker: '— БЛОГ · AI-ПОДДЕРЖКА ДЛЯ IGAMING', blogH1: 'Гайды по AI-поддержке в iGaming',
    blogLead: 'Как операторы казино и беттинга автоматизируют поддержку игроков, платежи, контроль качества и звонки — с реальными цифрами, без хайпа.',
    updated: 'ОБНОВЛЕНО', read: 'МИН ЧТЕНИЯ', by: 'КОМАНДА QODEQ', toc: 'СОДЕРЖАНИЕ', takeaways: 'ГЛАВНОЕ',
    faqKicker: '— FAQ', faqTitle: 'Частые вопросы', product: 'ПРОДУКТ',
    readMore: 'Читать →', guides: 'ВСЕ ГАЙДЫ', more: 'Подробнее →', relatedKicker: '— ДРУГИЕ ГАЙДЫ', overview: 'Обзор платформы',
    ctaPrimary: 'ПОЛУЧИТЬ РАСЧЁТ →',
    formKicker: '— ЗАПРОСИТЬ РАСЧЁТ', formName: 'Имя', formCompany: 'Компания', formContact: 'Email или Telegram', formSend: 'ОТПРАВИТЬ ЗАЯВКУ',
    formNote: 'Ответим в течение рабочего дня. Telegram: @qodeq',
    sending: 'Отправляем…', sent: 'Спасибо! Ответим в течение рабочего дня.', need: 'Укажите имя и контакт.',
    fail: 'Не удалось отправить. Напишите нам в Telegram @qodeq.',
    footBack: '← QODEQ · AI-ПЛАТФОРМА ДЛЯ IGAMING', footProducts: 'Продукты', footBlog: 'Гайды', footLegal: 'Правовая информация', privacy: 'Политика конфиденциальности',
    months: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  },
};

// ---------- контент ----------
const DIR = path.join(__dirname, 'content', 'blog');
const ALL = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).sort().map(f => require(path.join(DIR, f)));
const PILLAR = ALL.find(p => p.kind === 'pillar');
const POSTS = ALL.filter(p => p.kind !== 'pillar').sort((a, b) => (a.order || 0) - (b.order || 0));
// Правовые страницы (/privacy) — отдельный контент, тот же шаблон
const LEGAL = [require(path.join(__dirname, 'content', 'legal', 'privacy.js'))];
const legalPath = (lang, page) => `${UI[lang].prefix}/${page.slug}`;

// ---------- helpers ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// мини-разметка в тексте: **жирный**, [текст](/ссылка); ссылки вида /chat и /blog/x получают /ru в RU-версии
const inline = (s, lang) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\[(.+?)\]\((.+?)\)/g, (m, txt, href) => `<a href="${localHref(href, lang)}">${txt}</a>`);
const localHref = (href, lang) => (href.startsWith('/') && !href.startsWith('/ru/') && lang === 'ru') ? '/ru' + (href === '/' ? '/' : href) : href;
const plain = s => String(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[(.+?)\]\((.+?)\)/g, '$1');
const slugify = s => plain(s).toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60);
const fmtDate = (d, lang) => { const [y, m, dd] = d.split('-').map(Number); return lang === 'en' ? `${dd} ${UI.en.months[m - 1]} ${y}` : `${dd} ${UI.ru.months[m - 1]} ${y}`; };
const pathOf = (lang, page) => page.kind === 'pillar' ? `${UI[lang].prefix}/solutions/${page.slug}` : `${UI[lang].prefix}/blog/${page.slug}`;
const urlOf = (lang, page) => SITE + pathOf(lang, page);
const blogPath = lang => `${UI[lang].prefix}/blog`;
const faqItems = faq => faq[0] && faq[0].title ? faq.flatMap(g => g.items) : faq;
const words = t => [t.lead, ...(t.takeaways || []), ...t.body.flatMap(b => Object.values(b).flat(2)), ...faqItems(t.faq).flat()]
  .join(' ').split(/\s+/).length;
const mins = t => Math.max(3, Math.round(words(t) / 210));

const CSS = `
  :root { --bg: #0A0A09; --bg2: #0C0C0A; --bg3: #11110F; --text: #F5F2EC; --text2: #E8E6E1; --muted: #8A8579; --dim: #6E6A61; --faint: #57544C;
    --line: rgba(255,255,255,.09); --line2: rgba(255,255,255,.14); --body: #B5AFA2;
    --mono: 'JetBrains Mono', ui-monospace, monospace; --sans: 'Space Grotesk', system-ui, sans-serif; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--sans); overflow-x: hidden; }
  body::before { content: ''; position: fixed; left: 50%; top: -20vh; width: 90vw; height: 70vh; transform: translateX(-50%); background: radial-gradient(ellipse, color-mix(in srgb, var(--page-acc) 8%, transparent), transparent 65%); pointer-events: none; z-index: 0; }
  a { color: inherit; text-decoration: none; }
  p { margin: 0; }
  .btn, .nav a, .lang a { cursor: pointer; transition: background-color .15s ease, color .15s ease, border-color .15s ease; }
  .btn:hover, .nav a:hover, .lang a:hover { background-color: var(--btn-acc, var(--page-acc)) !important; border-color: var(--btn-acc, var(--page-acc)) !important; color: #0A0A09 !important; }
  .hdr { position: fixed; top: 0; left: 0; right: 0; z-index: 90; display: flex; flex-wrap: wrap; align-items: center; gap: 14px 18px; padding: 16px 32px; background: rgba(10,10,9,.82); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.07); }
  .hdr img { height: 40px; width: auto; display: block; }
  .nav { display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto; font: 400 10px/1 var(--mono); letter-spacing: .16em; }
  .nav a { padding: 8px 12px; border: 1px solid var(--line2); color: var(--muted); }
  .lang { display: flex; gap: 6px; }
  .lang a { padding: 7px 11px; border: 1px solid rgba(255,255,255,.16); color: var(--muted); font: 400 10px/1 var(--mono); letter-spacing: .16em; }
  .lang a[aria-current] { background: color-mix(in srgb, var(--page-acc) 14%, transparent); border-color: var(--page-acc); color: var(--page-acc); }
  main { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 48px); }
  section { padding: clamp(56px, 8vw, 100px) 0 0; }
  .kicker { margin: 0 0 18px; font: 400 11px/1.4 var(--mono); letter-spacing: .24em; color: var(--page-acc); }
  h1 { margin: 0 0 24px; max-width: 1000px; font: 500 clamp(32px, 4.8vw, 64px)/1.04 var(--sans); letter-spacing: -.03em; }
  h2 { margin: 0 0 22px; font: 500 clamp(24px, 2.6vw, 34px)/1.15 var(--sans); letter-spacing: -.022em; }
  h3 { margin: 0 0 10px; font: 500 19px/1.3 var(--sans); letter-spacing: -.01em; }
  .lead { max-width: 820px; font: 400 clamp(17px, 1.5vw, 20px)/1.55 var(--sans); color: var(--body); }
  .hero { padding-top: calc(73px + clamp(44px, 7vw, 96px)); }
  .crumbs { margin-bottom: 26px; font: 400 11px/1.4 var(--mono); letter-spacing: .14em; color: var(--dim); }
  .crumbs a:hover { color: var(--text); }
  .meta { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: 30px; font: 400 11px/1.4 var(--mono); letter-spacing: .16em; color: var(--muted); }
  .meta b { font-weight: 400; color: var(--page-acc); }
  .btn { display: inline-flex; align-items: center; padding: 16px 22px; border: 1px solid var(--line2); color: var(--text2); font: 500 11px/1 var(--mono); letter-spacing: .18em; background: transparent; }
  .btn.primary { background: var(--page-acc); border-color: var(--page-acc); color: #0A0A09; }

  /* ---------- статья ---------- */
  .layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: clamp(32px, 5vw, 80px); padding-top: clamp(44px, 6vw, 72px); }
  .toc { position: sticky; top: 100px; align-self: start; max-height: calc(100vh - 120px); overflow: auto; }
  .toc p { margin-bottom: 14px; font: 400 10px/1 var(--mono); letter-spacing: .22em; color: var(--faint); }
  .toc a { display: block; padding: 7px 0 7px 14px; border-left: 1px solid var(--line2); font: 400 13px/1.4 var(--sans); color: var(--muted); }
  .toc a:hover, .toc a.on { color: var(--text); border-left-color: var(--page-acc); }
  article { max-width: 780px; }
  article > h2 { margin-top: 64px; scroll-margin-top: 100px; }
  article > h2:first-child { margin-top: 0; }
  article > h3 { margin-top: 34px; }
  article > p { margin: 0 0 20px; font: 400 17px/1.75 var(--sans); color: var(--body); }
  article strong { color: var(--text); font-weight: 500; }
  article a:not(.card):not(.btn) { color: var(--text); border-bottom: 1px solid color-mix(in srgb, var(--page-acc) 60%, transparent); }
  article a:not(.card):not(.btn):hover { color: var(--page-acc); }
  article ul, article ol { margin: 0 0 24px; padding: 0; list-style: none; counter-reset: li; }
  article li { position: relative; padding: 0 0 12px 30px; font: 400 17px/1.65 var(--sans); color: var(--body); }
  article ul li::before { content: ''; position: absolute; left: 4px; top: .7em; width: 7px; height: 7px; background: var(--page-acc); }
  article ol li { counter-increment: li; }
  article ol li::before { content: counter(li, decimal-leading-zero); position: absolute; left: 0; top: .2em; font: 500 11px/1.6 var(--mono); color: var(--page-acc); }
  .box { margin: 0 0 40px; padding: 26px 28px; background: var(--bg2); border: 1px solid var(--line2); border-left: 2px solid var(--page-acc); }
  .box p.kicker { margin-bottom: 14px; }
  .box ul { margin: 0; } .box li:last-child { padding-bottom: 0; }
  .note { margin: 6px 0 32px; padding: 20px 24px; background: color-mix(in srgb, var(--page-acc) 7%, var(--bg)); border: 1px solid color-mix(in srgb, var(--page-acc) 30%, transparent); font: 400 16px/1.65 var(--sans); color: var(--text2); }
  .tbl { margin: 8px 0 32px; overflow-x: auto; border: 1px solid var(--line); }
  table { width: 100%; border-collapse: collapse; min-width: 520px; }
  th, td { padding: 14px 16px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; font: 400 14px/1.5 var(--sans); color: var(--body); }
  th { background: var(--bg3); font: 500 11px/1.4 var(--mono); letter-spacing: .12em; color: var(--muted); text-transform: uppercase; }
  td:first-child { color: var(--text2); }
  tr:last-child td { border-bottom: 0; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; margin: 8px 0 36px; background: var(--line); border: 1px solid var(--line); }
  .stat { padding: 22px 20px; background: var(--bg); }
  .stat b { display: block; margin-bottom: 8px; font: 500 clamp(26px, 2.8vw, 36px)/1 var(--sans); letter-spacing: -.03em; color: var(--page-acc); }
  .stat span { font: 400 11px/1.5 var(--mono); letter-spacing: .08em; color: var(--muted); text-transform: uppercase; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1px; margin: 8px 0 36px; background: var(--line); border: 1px solid var(--line); }
  .card { display: flex; flex-direction: column; gap: 12px; padding: 24px 22px; background: var(--bg2); border-top: 2px solid var(--card-acc); transition: background-color .2s ease, transform .2s ease; }
  .card:hover { background: #0E0E0C; transform: translateY(-3px); }
  .card h3 { margin: 0; font-size: 18px; }
  .card p { flex: 1; font: 400 14px/1.6 var(--sans); color: #9A958A; }
  .card .more { font: 500 10px/1 var(--mono); letter-spacing: .16em; color: var(--card-acc); }
  .card small { font: 400 10px/1 var(--mono); letter-spacing: .16em; color: var(--card-acc); }
  .posts { grid-template-columns: repeat(3, 1fr); gap: 16px; background: none; border: 0; }
  .posts .card { border: 1px solid var(--line); border-top: 2px solid var(--card-acc); }
  .posts .card h3 { font-size: 20px; line-height: 1.3; }

  /* ---------- индекс блога: обложка + нумерованный список ---------- */
  .feat { position: relative; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line2); overflow: hidden; }
  .feat > div { padding: clamp(26px, 4vw, 48px); background: var(--bg2); }
  .feat > div:last-child { background: var(--bg); display: flex; flex-direction: column; justify-content: space-between; gap: 28px; }
  .feat::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 2px; background: var(--page-acc); transform: scaleY(.25); transform-origin: top; transition: transform .5s cubic-bezier(.2,.7,.2,1); z-index: 1; }
  .feat:hover::before { transform: scaleY(1); }
  .feat h2 { margin: 0 0 18px; font-size: clamp(26px, 3.2vw, 44px); transition: color .2s ease; }
  .feat:hover h2 { color: var(--page-acc); }
  .feat p { max-width: 560px; font: 400 16px/1.65 var(--sans); color: var(--body); }
  .feat .go { display: inline-block; margin-top: 30px; font: 500 11px/1 var(--mono); letter-spacing: .18em; color: var(--page-acc); transition: transform .25s ease; }
  .feat:hover .go { transform: translateX(6px); }
  .fstats { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 18px; }
  .fstats b { display: block; margin-bottom: 6px; font: 500 clamp(28px, 3vw, 40px)/1 var(--sans); letter-spacing: -.03em; color: var(--page-acc); }
  .fstats span { font: 400 10px/1.5 var(--mono); letter-spacing: .1em; color: var(--muted); text-transform: uppercase; }
  .fprod { display: flex; flex-wrap: wrap; gap: 6px; }
  .fprod i { padding: 7px 10px; border: 1px solid var(--line2); border-left: 2px solid var(--c); font: 400 10px/1 var(--mono); font-style: normal; letter-spacing: .12em; color: var(--muted); }
  .rows-hd { display: flex; justify-content: space-between; align-items: baseline; margin: clamp(56px, 8vw, 96px) 0 0; padding-bottom: 16px; border-bottom: 1px solid var(--line2); font: 400 11px/1.4 var(--mono); letter-spacing: .2em; color: var(--muted); }
  .rows-hd b { font-weight: 400; color: var(--text); }
  .row { position: relative; display: grid; grid-template-columns: 90px minmax(0, 1fr) 150px 40px; gap: 24px; align-items: center; padding: 34px 0; border-bottom: 1px solid var(--line); isolation: isolate; }
  .row::before { content: ''; position: absolute; inset: 0 -24px; z-index: -1; background: linear-gradient(90deg, color-mix(in srgb, var(--c) 12%, transparent), transparent 70%); opacity: 0; transition: opacity .3s ease; }
  .row:hover::before { opacity: 1; }
  .row .n { font: 500 clamp(36px, 4vw, 56px)/1 var(--sans); letter-spacing: -.04em; color: transparent; -webkit-text-stroke: 1px var(--faint); transition: color .3s ease, -webkit-text-stroke-color .3s ease; }
  .row:hover .n { color: var(--c); -webkit-text-stroke-color: var(--c); }
  .row small { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px; font: 400 10px/1 var(--mono); letter-spacing: .18em; color: var(--c); }
  .row small::before { content: ''; width: 7px; height: 7px; background: var(--c); }
  .row h3 { margin: 0 0 10px; font: 500 clamp(20px, 2.1vw, 28px)/1.2 var(--sans); letter-spacing: -.02em; transition: color .2s ease; }
  .row p { max-width: 720px; font: 400 15px/1.6 var(--sans); color: #9A958A; }
  .row .rt { font: 400 11px/1.6 var(--mono); letter-spacing: .14em; color: var(--muted); text-align: right; }
  .row .ar { font: 400 24px/1 var(--mono); color: var(--faint); transition: transform .25s ease, color .25s ease; }
  .row:hover .ar { color: var(--c); transform: translateX(8px); }
  @media (max-width: 860px) { .feat { grid-template-columns: 1fr; } .row { grid-template-columns: 56px minmax(0, 1fr); gap: 6px 16px; padding: 26px 0; } .row .rt { grid-column: 2; text-align: left; } .row .ar { display: none; } .row .n { font-size: 34px; align-self: start; } }
  .prod { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; margin: 48px 0 0; padding: 24px 26px; border: 1px solid var(--line2); background: var(--bg2); }
  .prod span { font: 400 10px/1 var(--mono); letter-spacing: .2em; color: var(--muted); }
  .prod b { display: block; margin-top: 8px; font: 500 20px/1.2 var(--sans); }
  .faq { border-top: 1px solid var(--line); }
  .faq h3 { margin: 34px 0 6px; font: 400 11px/1.4 var(--mono); letter-spacing: .2em; color: var(--page-acc); text-transform: uppercase; }
  .faq details { border-bottom: 1px solid var(--line); }
  .faq summary { display: flex; justify-content: space-between; gap: 24px; padding: 22px 0; cursor: pointer; list-style: none; font: 500 clamp(16px, 1.5vw, 20px)/1.4 var(--sans); }
  .faq summary::-webkit-details-marker { display: none; }
  .faq summary::after { content: '+'; flex: 0 0 auto; font: 400 22px/1 var(--mono); color: var(--page-acc); transition: transform .2s ease; }
  .faq details[open] summary::after { transform: rotate(45deg); }
  .faq details p { max-width: 860px; padding: 0 0 24px; font: 400 16px/1.7 var(--sans); color: #9A958A; }
  .contact { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .contact > div, .contact form { padding: clamp(26px, 4vw, 48px); }
  .contact > div { background: var(--bg2); }
  .contact h2 { margin-bottom: 18px; font-size: clamp(26px, 3vw, 40px); }
  .contact form { position: relative; display: flex; flex-direction: column; justify-content: center; gap: 10px; background: var(--bg); }
  .contact input { width: 100%; padding: 15px 16px; background: var(--bg3); border: 1px solid var(--line2); color: var(--text); font: 400 15px/1.2 var(--sans); border-radius: 0; }
  .contact input:focus { outline: none; border-color: var(--page-acc); }
  .contact .hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
  .contact .btn { justify-content: center; margin-top: 6px; }
  .contact .msg { min-height: 1.4em; font: 400 12px/1.5 var(--mono); color: var(--muted); }
  .contact .msg.ok { color: #4FD1A5; } .contact .msg.err { color: #F4794C; }
  .contact .small { margin-top: 18px; font: 400 12px/1.6 var(--mono); color: var(--dim); }
  footer { position: relative; z-index: 1; max-width: 1280px; margin: clamp(70px, 10vw, 120px) auto 0; padding: 40px clamp(16px, 4vw, 48px) 48px; border-top: 1px solid var(--line); display: flex; flex-wrap: wrap; justify-content: space-between; gap: 30px; font: 400 13px/1.9 var(--sans); color: #9A958A; }
  footer .col span { display: block; margin-bottom: 8px; font: 400 10px/1 var(--mono); letter-spacing: .2em; color: var(--faint); text-transform: uppercase; }
  footer .col a { display: block; }
  footer .col a:hover, footer .back:hover { color: var(--text); }
  footer .back { font: 400 11px/1.6 var(--mono); letter-spacing: .14em; color: var(--faint); }
  .js [data-r] { opacity: 0; transform: translateY(18px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
  .js [data-r].in { opacity: 1; transform: none; }
  @media (max-width: 980px) { .layout { grid-template-columns: minmax(0, 1fr); } .toc { display: none; } .contact { grid-template-columns: 1fr; } .posts { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 640px) { .posts { grid-template-columns: 1fr; } }
  @media (max-width: 860px) { .nav { display: none; } .hdr { padding: 12px 16px; } .hdr .lang { margin-left: auto; } .hero { padding-top: calc(65px + 40px); } }
  @media (max-width: 560px) { article > p, article li { font-size: 16px; } .box { padding: 20px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } .js [data-r] { opacity: 1; transform: none; } }
`;

// ---------- общие куски ----------
function head({ lang, title, desc, self, alt, ld, ogType }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NY9Q210KNW"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-NY9Q210KNW');
</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.className += ' js';</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${self}" />
<link rel="alternate" hreflang="en" href="${alt.en}" />
<link rel="alternate" hreflang="ru" href="${alt.ru}" />
<link rel="alternate" hreflang="x-default" href="${alt.en}" />
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="icon" href="/assets/brand/favicon-16.png" sizes="16x16" type="image/png" />
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png" />
<meta property="og:type" content="${ogType}" />
<meta property="og:locale" content="${UI[lang].locale}" />
<meta property="og:site_name" content="QODEQ" />
<meta property="og:url" content="${self}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${SITE}/assets/brand/og-image.png?v=2" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${SITE}/assets/brand/og-image.png?v=2" />
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>${CSS}</style>
</head>`;
}

function header(lang, alt) {
  const ui = UI[lang];
  return `<header class="hdr">
  <a href="${ui.home}" aria-label="QODEQ"><img src="/assets/brand/logo-compact.png?v=2" alt="QODEQ" /></a>
  <nav class="nav">
${ui.nav.map(([h, l, c]) => `    <a href="${h}" style="border-left: 2px solid ${c}; --btn-acc: ${c};">${esc(l)}</a>`).join('\n')}
  </nav>
  <div class="lang">
    <a href="${alt.en.replace(SITE, '')}" hreflang="en"${lang === 'en' ? ' aria-current="page"' : ''}>EN</a>
    <a href="${alt.ru.replace(SITE, '')}" hreflang="ru"${lang === 'ru' ? ' aria-current="page"' : ''}>RU</a>
  </div>
</header>`;
}

function footer(lang) {
  const ui = UI[lang];
  return `<footer>
  <div class="col">
    <span>${esc(ui.footProducts)}</span>
${Object.keys(PROD_NAME).map(k => `    <a href="${ui.prefix}/${k}">${PROD_NAME[k]}</a>`).join('\n')}
  </div>
  <div class="col">
    <span>${esc(ui.footBlog)}</span>
    <a href="${pathOf(lang, PILLAR)}">${esc(PILLAR[lang].nav)}</a>
${POSTS.map(p => `    <a href="${pathOf(lang, p)}">${esc(p[lang].nav)}</a>`).join('\n')}
  </div>
  <div class="col">
    <span>Telegram</span>
    <a href="https://t.me/qodeq">@qodeq</a>
  </div>
  <div class="col">
    <span>${esc(ui.footLegal)}</span>
    <a href="${ui.prefix}/privacy">${esc(ui.privacy)}</a>
  </div>
  <a class="back" href="${ui.home}">${esc(ui.footBack)}</a>
</footer>`;
}

function contact(lang, t, product, slug) {
  const ui = UI[lang];
  return `  <section id="contact">
    <p class="kicker" data-r>${esc(ui.formKicker)}</p>
    <div class="contact" data-r>
      <div>
        <h2>${esc(t.ctaTitle)}</h2>
        <p class="lead">${esc(t.ctaText)}</p>
        <p class="small">${esc(ui.formNote)}</p>
      </div>
      <form data-lead novalidate>
        <input type="text" name="name" placeholder="${esc(ui.formName)}" autocomplete="name" />
        <input type="text" name="company" placeholder="${esc(ui.formCompany)}" autocomplete="organization" />
        <input type="text" name="contact" placeholder="${esc(ui.formContact)}" autocomplete="email" />
        <input class="hp" type="text" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <button class="btn primary" type="submit">${esc(ui.formSend)}</button>
        <p class="msg" data-msg role="status"></p>
      </form>
    </div>
  </section>`;
}

function scripts(lang, product, slug) {
  const ui = UI[lang];
  return `<script>
(function () {
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 }) : null;
  [].forEach.call(document.querySelectorAll('[data-r]'), function (el) { io ? io.observe(el) : el.classList.add('in'); });
  // подсветка текущего раздела в оглавлении
  var links = [].slice.call(document.querySelectorAll('.toc a'));
  if (links.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-90px 0px -70% 0px' });
    links.forEach(function (a) { var h = document.getElementById(a.getAttribute('href').slice(1)); if (h) spy.observe(h); });
  }
})();
(function () {
  var f = document.querySelector('[data-lead]'); if (!f) return;
  var msg = f.querySelector('[data-msg]'), busy = false;
  var T = ${JSON.stringify({ sending: ui.sending, sent: ui.sent, need: ui.need, fail: ui.fail })};
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var name = f.name.value.trim(), company = f.company.value.trim(), contact = f.contact.value.trim();
    if (f.hp.value) { msg.className = 'msg ok'; msg.textContent = T.sent; return; }
    if (!name || !contact) { msg.className = 'msg err'; msg.textContent = T.need; return; }
    busy = true; msg.className = 'msg'; msg.textContent = T.sending;
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, company: company, contact: contact, hp: f.hp.value, lang: '${lang}', page: location.href, product: ${JSON.stringify(product)} })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      msg.className = 'msg ok'; msg.textContent = T.sent; f.reset();
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { method: 'blog_${slug.replace(/-/g, '_')}' });
    }).catch(function () { msg.className = 'msg err'; msg.textContent = T.fail; })
      .then(function () { busy = false; });
  });
})();
</script>`;
}

// ---------- блоки статьи ----------
// { h2 } { h3 } { p } { ul: [] } { ol: [] } { table: [[шапка], [строка]…] } { stats: [[значение, подпись]…] } { note } { cards: [[productKey, заголовок, текст]…] }
function block(b, lang) {
  const ui = UI[lang];
  if (b.h2) return `<h2 id="${b.id || slugify(b.h2)}">${inline(b.h2, lang)}</h2>`;
  if (b.h3) return `<h3>${inline(b.h3, lang)}</h3>`;
  if (b.p) return `<p>${inline(b.p, lang)}</p>`;
  if (b.ul) return `<ul>\n${b.ul.map(li => `  <li>${inline(li, lang)}</li>`).join('\n')}\n</ul>`;
  if (b.ol) return `<ol>\n${b.ol.map(li => `  <li>${inline(li, lang)}</li>`).join('\n')}\n</ol>`;
  if (b.note) return `<p class="note">${inline(b.note, lang)}</p>`;
  if (b.stats) return `<div class="stats">\n${b.stats.map(([v, l]) => `  <div class="stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('\n')}\n</div>`;
  if (b.table) {
    const [hd, ...rows] = b.table;
    return `<div class="tbl"><table>\n  <thead><tr>${hd.map(c => `<th>${inline(c, lang)}</th>`).join('')}</tr></thead>\n  <tbody>\n${rows.map(r => `    <tr>${r.map(c => `<td>${inline(c, lang)}</td>`).join('')}</tr>`).join('\n')}\n  </tbody>\n</table></div>`;
  }
  if (b.cards) return `<div class="cards">\n${b.cards.map(([k, h, p]) => `  <a class="card" href="${ui.prefix}/${k}" style="--card-acc: ${ACC[k]};"><small>${PROD_NAME[k].toUpperCase()}</small><h3>${inline(h, lang)}</h3><p>${inline(p, lang)}</p><span class="more">${esc(ui.more)}</span></a>`).join('\n')}\n</div>`;
  throw new Error('unknown block ' + JSON.stringify(b).slice(0, 80));
}

function faqHtml(faq, lang) {
  const det = (q, a, i) => `      <details${i === 0 ? ' open' : ''}><summary>${esc(plain(q))}</summary><p>${inline(a, lang)}</p></details>`;
  if (faq[0] && faq[0].title) return faq.map(g => `      <h3>${esc(g.title)}</h3>\n${g.items.map(([q, a], i) => det(q, a, i)).join('\n')}`).join('\n');
  return faq.map(([q, a], i) => det(q, a, i)).join('\n');
}

// ---------- страница статьи / обзора ----------
function renderPage(page, lang) {
  const t = page[lang], ui = UI[lang];
  const self = urlOf(lang, page), alt = { en: urlOf('en', page), ru: urlOf('ru', page) };
  const acc = ACC[page.product] || '#E8B23A';
  const toc = t.body.filter(b => b.h2);
  const isPillar = page.kind === 'pillar';
  const crumbBase = isPillar ? null : { name: ui.blog, url: SITE + blogPath(lang) };
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': SITE + '/#org', name: 'QODEQ', url: SITE + '/', logo: SITE + '/assets/brand/logo-main.png', sameAs: ['https://t.me/qodeq'] },
      isPillar
        ? { '@type': 'WebPage', '@id': self, url: self, name: t.title, description: t.desc, inLanguage: lang, dateModified: page.updated,
            isPartOf: { '@type': 'WebSite', name: 'QODEQ', url: SITE + '/' }, publisher: { '@id': SITE + '/#org' },
            about: { '@type': 'SoftwareApplication', name: 'QODEQ', applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
              description: plain(t.lead), offers: { '@type': 'Offer', price: '0.18', priceCurrency: 'USD', description: t.offer } } }
        : { '@type': 'Article', '@id': self + '#article', mainEntityOfPage: self, headline: t.h1, description: t.desc, inLanguage: lang,
            datePublished: page.published, dateModified: page.updated, wordCount: words(t),
            author: { '@id': SITE + '/#org' }, publisher: { '@id': SITE + '/#org' }, image: SITE + '/assets/brand/og-image.png?v=2',
            about: { '@type': 'SoftwareApplication', name: PROD_NAME[page.product], applicationCategory: 'BusinessApplication', url: SITE + ui.prefix + '/' + page.product } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'QODEQ', item: SITE + ui.home },
        ...(crumbBase ? [{ '@type': 'ListItem', position: 2, name: crumbBase.name, item: crumbBase.url }] : []),
        { '@type': 'ListItem', position: crumbBase ? 3 : 2, name: t.nav, item: self },
      ] },
      { '@type': 'FAQPage', mainEntity: faqItems(t.faq).map(([q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) },
    ],
  };
  // 3 карточки внизу: обзор + две следующие статьи по кругу (на обзоре — первые три статьи)
  const i = POSTS.findIndex(p => p.slug === page.slug);
  const related = isPillar ? POSTS.slice(0, 3) : [PILLAR, POSTS[(i + 1) % POSTS.length], POSTS[(i + 2) % POSTS.length]];
  return `${head({ lang, title: t.title, desc: t.desc, self, alt, ld, ogType: isPillar ? 'website' : 'article' })}
<body style="--page-acc: ${acc};">

${header(lang, alt)}

<main>
  <section class="hero">
    <nav class="crumbs" aria-label="breadcrumbs"><a href="${ui.home}">QODEQ</a>${crumbBase ? ` / <a href="${blogPath(lang)}">${esc(ui.blog)}</a>` : ''} / ${esc(t.nav)}</nav>
    <p class="kicker">${esc(t.kicker)}</p>
    <h1>${esc(t.h1)}</h1>
    <p class="lead">${inline(t.lead, lang)}</p>
    <div class="meta"><span>${ui.updated} <b>${fmtDate(page.updated, lang).toUpperCase()}</b></span><span>${mins(t)} ${ui.read}</span><span>${ui.by}</span></div>
  </section>

  <div class="layout">
    <aside class="toc" aria-label="${ui.toc}">
      <p>${ui.toc}</p>
${toc.map(b => `      <a href="#${b.id || slugify(b.h2)}">${esc(plain(b.h2))}</a>`).join('\n')}
      <a href="#faq">${esc(ui.faqTitle)}</a>
    </aside>
    <article>
${t.takeaways ? `<div class="box">\n  <p class="kicker">${ui.takeaways}</p>\n  <ul>\n${t.takeaways.map(x => `    <li>${inline(x, lang)}</li>`).join('\n')}\n  </ul>\n</div>\n` : ''}${t.body.map(b => block(b, lang)).join('\n')}
${isPillar ? '' : `<div class="prod" style="--page-acc: ${acc};"><div><span>${ui.product}</span><b>${PROD_NAME[page.product]}</b></div><a class="btn primary" href="${ui.prefix}/${page.product}">${esc(ui.more.toUpperCase())}</a></div>`}
    </article>
  </div>

  <section id="faq">
    <p class="kicker">${esc(ui.faqKicker)}</p>
    <h2>${esc(ui.faqTitle)}</h2>
    <div class="faq">
${faqHtml(t.faq, lang)}
    </div>
  </section>

${contact(lang, t, page.leadProduct, page.slug)}

  <section>
    <p class="kicker">${esc(ui.relatedKicker)}</p>
    <div class="cards posts">
${related.map(p => `      <a class="card" href="${pathOf(lang, p)}" style="--card-acc: ${ACC[p.product] || '#E8B23A'};"><small>${p.kind === 'pillar' ? esc(ui.overview.toUpperCase()) : PROD_NAME[p.product].toUpperCase()}</small><h3>${esc(p[lang].h1)}</h3><p>${esc(p[lang].desc)}</p><span class="more">${esc(ui.readMore)}</span></a>`).join('\n')}
    </div>
  </section>
</main>

${footer(lang)}

${scripts(lang, page.leadProduct, page.slug)}
</body>
</html>
`;
}

// ---------- правовая страница (/privacy) ----------
// {{mail}} в тексте → ссылка на support@, собираемая скриптом (литеральный email в HTML
// Cloudflare переписывает, см. CLAUDE.md).
function renderLegal(page, lang) {
  const t = page[lang], ui = UI[lang];
  const self = SITE + legalPath(lang, page), alt = { en: SITE + legalPath('en', page), ru: SITE + legalPath('ru', page) };
  const toc = t.body.filter(b => b.h2);
  const mail = '<a href="#" data-mail-user="support" data-mail-host="qodeq.net">support [at] qodeq.net</a>';
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': self, url: self, name: t.title, description: t.desc, inLanguage: lang, dateModified: page.updated,
        isPartOf: { '@type': 'WebSite', name: 'QODEQ', url: SITE + '/' }, publisher: { '@type': 'Organization', name: 'QODEQ', url: SITE + '/' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'QODEQ', item: SITE + ui.home },
        { '@type': 'ListItem', position: 2, name: t.nav, item: self },
      ] },
    ],
  };
  return `${head({ lang, title: t.title, desc: t.desc, self, alt, ld, ogType: 'website' })}
<body style="--page-acc: #E8B23A;">

${header(lang, alt)}

<main>
  <section class="hero">
    <nav class="crumbs" aria-label="breadcrumbs"><a href="${ui.home}">QODEQ</a> / ${esc(t.nav)}</nav>
    <p class="kicker">${esc(t.kicker)}</p>
    <h1>${esc(t.h1)}</h1>
    <p class="lead">${inline(t.lead, lang)}</p>
    <div class="meta"><span>${ui.updated} <b>${fmtDate(page.updated, lang).toUpperCase()}</b></span></div>
  </section>

  <div class="layout">
    <aside class="toc" aria-label="${ui.toc}">
      <p>${ui.toc}</p>
${toc.map(b => `      <a href="#${b.id || slugify(b.h2)}">${esc(plain(b.h2))}</a>`).join('\n')}
    </aside>
    <article>
${t.body.map(b => block(b, lang)).join('\n').split('{{mail}}').join(mail)}
    </article>
  </div>
</main>

${footer(lang)}

${scripts(lang, 'Privacy', page.slug)}
<script>
[].forEach.call(document.querySelectorAll('[data-mail-user]'), function (a) {
  var m = a.getAttribute('data-mail-user') + '@' + a.getAttribute('data-mail-host');
  a.href = 'mailto:' + m; a.textContent = m;
});
</script>
</body>
</html>
`;
}

// ---------- индекс блога ----------
function renderIndex(lang) {
  const ui = UI[lang];
  const self = SITE + blogPath(lang), alt = { en: SITE + blogPath('en'), ru: SITE + blogPath('ru') };
  const all = [PILLAR, ...POSTS];
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Blog', '@id': self, url: self, name: ui.blogTitle, description: ui.blogDesc, inLanguage: lang,
        publisher: { '@type': 'Organization', name: 'QODEQ', url: SITE + '/', logo: SITE + '/assets/brand/logo-main.png' },
        blogPost: POSTS.map(p => ({ '@type': 'BlogPosting', headline: p[lang].h1, url: urlOf(lang, p), datePublished: p.published, dateModified: p.updated })) },
      { '@type': 'ItemList', itemListElement: all.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: urlOf(lang, p), name: p[lang].h1 })) },
    ],
  };
  return `${head({ lang, title: ui.blogTitle, desc: ui.blogDesc, self, alt, ld, ogType: 'website' })}
<body style="--page-acc: #E8B23A;">

${header(lang, alt)}

<main>
  <section class="hero">
    <p class="kicker">${esc(ui.blogKicker)}</p>
    <h1>${esc(ui.blogH1)}</h1>
    <p class="lead">${esc(ui.blogLead)}</p>
  </section>
  <section>
    <a class="feat" data-r href="${pathOf(lang, PILLAR)}">
      <div>
        <p class="kicker">${esc(ui.overview.toUpperCase())} · ${mins(PILLAR[lang])} ${ui.read}</p>
        <h2>${esc(PILLAR[lang].h1)}</h2>
        <p>${esc(PILLAR[lang].desc)}</p>
        <span class="go">${esc(ui.readMore.toUpperCase())}</span>
      </div>
      <div>
        <div class="fstats">
${PILLAR[lang].body.find(b => b.stats).stats.map(([v, l]) => `          <div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('\n')}
        </div>
        <div class="fprod">${Object.keys(PROD_NAME).map(k => `<i style="--c: ${ACC[k]};">${PROD_NAME[k].toUpperCase()}</i>`).join('')}</div>
      </div>
    </a>

    <div class="rows-hd"><span>${esc(ui.guides)}</span><b>${String(POSTS.length).padStart(2, '0')}</b></div>
${POSTS.map((p, i) => `    <a class="row" data-r href="${pathOf(lang, p)}" style="--c: ${ACC[p.product]};">
      <span class="n">${String(i + 1).padStart(2, '0')}</span>
      <div><small>${PROD_NAME[p.product].toUpperCase()}</small><h3>${esc(p[lang].h1)}</h3><p>${esc(p[lang].desc)}</p></div>
      <span class="rt">${mins(p[lang])} ${ui.read}<br>${fmtDate(p.updated, lang).toUpperCase()}</span>
      <span class="ar" aria-hidden="true">→</span>
    </a>`).join('\n')}
  </section>
</main>

${footer(lang)}

${scripts(lang, 'Blog', 'index')}
</body>
</html>
`;
}

// ---------- сборка ----------
const out = (rel, html) => {
  const p = path.join(__dirname, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, html, 'utf8');
  console.log('wrote', rel.replace(/\\/g, '/'));
};
for (const lang of ['en', 'ru']) {
  const pre = UI[lang].prefix.replace(/^\//, '');
  for (const page of ALL) out(path.join(pre, page.kind === 'pillar' ? 'solutions' : 'blog', page.slug + '.html'), renderPage(page, lang));
  out(path.join(pre, 'blog', 'index.html'), renderIndex(lang));
  for (const page of LEGAL) out(path.join(pre, page.slug + '.html'), renderLegal(page, lang));
}
// урлы для sitemap.xml
if (process.argv.includes('--urls')) for (const p of [...ALL.map(p => urlOf('en', p)), SITE + '/blog', ...LEGAL.map(p => SITE + legalPath('en', p)), ...ALL.map(p => urlOf('ru', p)), SITE + '/ru/blog', ...LEGAL.map(p => SITE + legalPath('ru', p))]) console.log(p);
