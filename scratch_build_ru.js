// Build script: generates static RU HTML variants for /ru/* URLs by baking each page's
// existing translation dictionary into the DOM at build time (instead of relying on the
// client-side toggle), so crawlers and non-JS clients see real Russian content.
const fs = require('fs');
const { JSDOM } = require('jsdom');

const PAGES = [
  {
    src: 'QODEQ.dc.html', out: 'QODEQ.ru.dc.html',
    enUrl: 'https://qodeq.net/', ruUrl: 'https://qodeq.net/ru/',
    dictVar: 'window.QODEQ_I18N', dictPath: ['ru'],
    title: 'QODEQ — AI-платформа поддержки для iGaming и онлайн-казино',
    description: 'AI Chat Operator, AI QA System, AI Payment Assistant и AI Voice Bot на одной платформе. Снижаем расходы на поддержку iGaming вдвое — автоматизация 65%+, 24/7, любой язык.',
    stateLangPatch: null, // homepage uses data-props lang instead
  },
  {
    src: 'Product-Chat.dc.html', out: 'Product-Chat.ru.dc.html',
    enUrl: 'https://qodeq.net/chat', ruUrl: 'https://qodeq.net/ru/chat',
    dictVar: 'RU_DICT', dictPath: [],
    title: 'AI-оператор чата для поддержки iGaming и казино | QODEQ',
    description: 'Собственная LLM, обученная на 5М чатов поддержки iGaming — закрывает KYC, бонусы и выплаты от начала до конца. 65% решается без участия человека, ответ за 7 секунд.',
    stateLangPatch: { from: "state = { lang: 'en' };", to: "state = { lang: 'ru' };" },
  },
  {
    src: 'Product-QA-Chat.dc.html', out: 'Product-QA-Chat.ru.dc.html',
    enUrl: 'https://qodeq.net/qa-chat', ruUrl: 'https://qodeq.net/ru/qa-chat',
    dictVar: 'RU_DICT', dictPath: [],
    title: 'AI-контроль качества чатов поддержки iGaming | QODEQ',
    description: 'AI-анализ 100% чатов в реальном времени — 15 взвешенных критериев, точность 97,6%, ежедневные отчёты по операторам, поднимающие показатели на 25–40%.',
    stateLangPatch: { from: 'if (this.lang === \'ru\') this.applyLang(\'ru\');', to: "this.lang = 'ru'; this.applyLang('ru');" },
  },
  {
    src: 'Product-Payment.dc.html', out: 'Product-Payment.ru.dc.html',
    enUrl: 'https://qodeq.net/payment', ruUrl: 'https://qodeq.net/ru/payment',
    dictVar: 'RU_DICT', dictPath: [],
    title: 'AI-ассистент по депозитам и выплатам для iGaming | QODEQ',
    description: '«Где мой депозит?» — ответ за 10 секунд. Живые данные PSP, автосоздание тикетов и проверка PDF-чеков на подделку — 45%+ решается автоматически.',
    stateLangPatch: { from: "state = { lang: 'en' };", to: "state = { lang: 'ru' };" },
  },
  {
    src: 'Product-QA-Call.dc.html', out: 'Product-QA-Call.ru.dc.html',
    enUrl: 'https://qodeq.net/qa-call', ruUrl: 'https://qodeq.net/ru/qa-call',
    dictVar: 'RU_DICT', dictPath: [],
    title: 'AI-контроль качества звонков для колл-центров | QODEQ',
    description: 'Транскрибация Whisper плюс 15 критериев оценки на каждом входящем и исходящем звонке. Превращаем ручной охват 2,6% в 100% — никакой выборки.',
    stateLangPatch: { from: "state = { lang: 'en' };", to: "state = { lang: 'ru' };" },
  },
  {
    src: 'Product-Voice.dc.html', out: 'Product-Voice.ru.dc.html',
    enUrl: 'https://qodeq.net/voice', ruUrl: 'https://qodeq.net/ru/voice',
    dictVar: 'RU_DICT', dictPath: [],
    title: 'AI голосовой бот для исходящих звонков iGaming | QODEQ',
    description: 'Исходящий обзвон 24/7 на нескольких языках, строго по скрипту. Один бот обрабатывает в 10× больше диалогов в день, чем команда из 2,5 операторов.',
    stateLangPatch: { from: "state = { lang: 'en' };", to: "state = { lang: 'ru' };" },
  },
  {
    // Plain HTML page (no dc runtime): reads <html lang> at runtime, so no state patch.
    src: 'Calculator.html', out: 'Calculator.ru.html',
    enUrl: 'https://qodeq.net/calculator', ruUrl: 'https://qodeq.net/ru/calculator',
    dictVar: 'RU_DICT', dictPath: [],
    title: 'Калькулятор стоимости поддержки iGaming с AI | QODEQ',
    description: 'Посчитайте, сколько стоит поддержка игроков сейчас и с AI. Введите объёмы чатов, платёжных тикетов и звонков, стоимость и производительность операторов — получите экономию, окупаемость и ссылку на расчёт.',
    stateLangPatch: null,
  },
];

// Internal routes that have a /ru/ twin — used by pages with localizeLinks.
const RU_ROUTES = { '/': '/ru/', '/chat': '/ru/chat', '/qa-chat': '/ru/qa-chat', '/payment': '/ru/payment', '/qa-call': '/ru/qa-call', '/voice': '/ru/voice', '/calculator': '/ru/calculator', '/blog': '/ru/blog', '/solutions/ai-customer-support-igaming': '/ru/solutions/ai-customer-support-igaming', '/solutions/online-casino-customer-support': '/ru/solutions/online-casino-customer-support', '/solutions/sportsbook-customer-support': '/ru/solutions/sportsbook-customer-support', '/solutions/customer-support-quality-assurance': '/ru/solutions/customer-support-quality-assurance' };

function extractDict(html, varName) {
  // Handles both "const RU_DICT = {...}" and "window.QODEQ_I18N = {...}"
  const re = varName === 'RU_DICT'
    ? /const RU_DICT = (\{[\s\S]*?\n\});/
    : /window\.QODEQ_I18N = (\{[\s\S]*?\n\});/;
  const m = html.match(re);
  if (!m) throw new Error('dict not found for ' + varName);
  return new Function('return ' + m[1])();
}

function translateDom(doc, dict) {
  doc.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    const v = dict[k];
    if (v) el.textContent = v;
  });
  doc.querySelectorAll('[data-text-ru]').forEach(el => {
    el.textContent = el.getAttribute('data-text-ru');
  });
  doc.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const k = el.getAttribute('data-i18n-ph');
    const v = dict[k];
    if (v) el.setAttribute('value', v);
  });
}

PAGES.forEach(page => {
  if (!fs.existsSync(page.src)) { console.log("skip", page.src, "(not in this tree)"); return; }
  let html = fs.readFileSync(page.src, 'utf8');
  let dict = extractDict(html, page.dictVar);
  page.dictPath.forEach(k => { dict = dict[k]; });

  const dom = new JSDOM(html);
  const doc = dom.window.document;
  translateDom(doc, dict);

  // html lang
  doc.documentElement.setAttribute('lang', 'ru');

  // title / description / OG / twitter
  const setMeta = (selector, attr, value) => {
    const el = doc.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  doc.title = page.title;
  setMeta('meta[name="description"]', 'content', page.description);
  setMeta('meta[property="og:title"]', 'content', page.title);
  setMeta('meta[property="og:description"]', 'content', page.description);
  setMeta('meta[property="og:url"]', 'content', page.ruUrl);
  setMeta('meta[property="og:locale"]', 'content', 'ru_RU');
  setMeta('meta[property="og:locale:alternate"]', 'content', 'en_US');
  setMeta('link[rel="canonical"]', 'href', page.ruUrl);

  // Point internal links at the /ru/ twins so the RU section links to itself
  // (otherwise /ru/ pages pass their weight to the EN URLs).
  doc.querySelectorAll('body a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (a.hasAttribute('hreflang')) return; // language switcher keeps both targets
    const [path, hash] = href.split('#');
    if (RU_ROUTES[path]) a.setAttribute('href', RU_ROUTES[path] + (hash !== undefined ? '#' + hash : ''));
  });

  // JSON-LD description (best-effort — leave name/offers as-is, just localize description)
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    try {
      const obj = JSON.parse(s.textContent);
      const type = obj['@type'];
      if (type === 'Organization') return; // one entity for both languages
      if (type === 'WebSite') { obj.url = page.ruUrl; obj.inLanguage = 'ru'; }
      else if (type === 'ItemList') {
        (obj.itemListElement || []).forEach(li => {
          const ru = u => { const p = u.replace('https://qodeq.net', ''); return RU_ROUTES[p] ? 'https://qodeq.net' + RU_ROUTES[p] : u; };
          li.url = ru(li.url); if (li.item && li.item.url) li.item.url = ru(li.item.url);
        });
      } else { obj.description = page.description; obj.url = page.ruUrl; }
      s.textContent = JSON.stringify(obj, null, 2);
    } catch (e) {}
  });

  // hreflang: add alternate links pointing at both language versions + x-default.
  // The EN sources already carry the same set (scratch_add_hreflang_en.js), so drop
  // those first — otherwise every rebuild duplicates them.
  const head = doc.querySelector('head');
  head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(l => {
    const ws = l.nextSibling;
    if (ws && ws.nodeType === 3 && !ws.textContent.trim()) ws.remove();
    l.remove();
  });
  ['en', 'ru', 'x-default'].forEach(hl => {
    const link = doc.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hl);
    link.setAttribute('href', hl === 'ru' ? page.ruUrl : page.enUrl);
    head.appendChild(link);
  });

  let out = dom.serialize();

  // RU pages live one level deeper (/ru/chat), so "./support.js" or "./assets/…" would
  // resolve to /ru/support.js and 404 — the dc runtime never boots. Make them root-absolute.
  out = out.split('src="./').join('src="/');

  // Homepage: flip the data-props "lang" default to ru so componentDidMount's
  // `this.props.lang === 'ru'` branch re-confirms RU state (fixes the EN/RU button
  // highlight, which otherwise stays stuck showing EN as active).
  if (page.src === 'QODEQ.dc.html') {
    out = out.replace('&quot;lang&quot;:{&quot;editor&quot;:&quot;enum&quot;,&quot;default&quot;:&quot;en&quot;', '&quot;lang&quot;:{&quot;editor&quot;:&quot;enum&quot;,&quot;default&quot;:&quot;ru&quot;');
  }

  // Product pages: patch the hardcoded initial language state so the toggle buttons
  // show the correct active state without waiting for a click.
  if (page.stateLangPatch) {
    const { from, to } = page.stateLangPatch;
    if (out.includes(from)) out = out.split(from).join(to);
  }

  // Voice page's browser-locale auto-detect would otherwise flip non-RU-locale visitors
  // back to English on mount — force it to RU on this variant.
  if (page.src === 'Product-Voice.dc.html') {
    const marker = "const initialLang = (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';";
    if (out.includes(marker)) out = out.split(marker).join("const initialLang = 'ru';");
  }

  fs.writeFileSync(page.out, out, 'utf8');
  console.log('wrote', page.out, '(' + out.length + ' bytes)');
});
