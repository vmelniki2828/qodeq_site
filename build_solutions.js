// Генератор посадочных страниц /solutions/* и /ru/solutions/* (SEO).
// Один шаблон + тексты EN/RU ниже → статические HTML без dc-runtime.
// Запуск: node build_solutions.js  (зависимостей нет)
// Все цифры взяты с продуктовых страниц сайта — при изменении цен/метрик там
// обновите их и здесь, затем пересоберите и скопируйте в deploy/public/.
const fs = require('fs');
const path = require('path');

const SITE = 'https://qodeq.net';
const ACC = { chat: '#4FD1A5', qa: '#E8B23A', pay: '#5FA5F9', qacall: '#C084F5', voice: '#F4794C' };

// ---------- общие строки интерфейса ----------
const UI = {
  en: {
    home: '/', prefix: '',
    nav: [['/chat', '01 CHAT', ACC.chat], ['/qa-chat', '02 QA CHAT', ACC.qa], ['/payment', '03 PAYMENT', ACC.pay], ['/qa-call', '04 QA CALL', ACC.qacall], ['/voice', '05 VOICE', ACC.voice]],
    ctaPrimary: 'GET A CALCULATION →', ctaSecondary: 'SEE THE PLATFORM',
    howKicker: '— HOW QODEQ HANDLES IT', econKicker: '— ECONOMICS', stepsKicker: '— IMPLEMENTATION', faqKicker: '— FAQ', faqTitle: 'Frequently asked questions',
    more: 'Learn more →',
    formKicker: '— REQUEST A CALCULATION', formName: 'Name', formCompany: 'Company', formContact: 'Email or Telegram', formSend: 'SEND REQUEST',
    formNote: 'We reply within one business day. Telegram: @qodeq',
    sending: 'Sending…', sent: 'Thanks! We’ll reply within one business day.', need: 'Please add your name and a contact.',
    fail: 'Could not send. Please message us on Telegram @qodeq.',
    relatedKicker: '— MORE SOLUTIONS',
    footBack: '← QODEQ · AI PLATFORM FOR IGAMING', footProducts: 'Products', footSolutions: 'Solutions', footResources: 'Resources', resources: [['/calculator', 'Cost calculator'], ['/solutions/ai-customer-support-igaming', 'Platform overview'], ['/blog', 'Blog']],
    products: [['/chat', 'AI Chat Operator'], ['/qa-chat', 'AI QA System'], ['/payment', 'AI Payment Assistant'], ['/qa-call', 'AI Voice QA'], ['/voice', 'AI Voice Bot']],
  },
  ru: {
    home: '/ru/', prefix: '/ru',
    nav: [['/ru/chat', '01 ЧАТ', ACC.chat], ['/ru/qa-chat', '02 QA-ЧАТ', ACC.qa], ['/ru/payment', '03 ПЛАТЕЖИ', ACC.pay], ['/ru/qa-call', '04 QA-ЗВОНКИ', ACC.qacall], ['/ru/voice', '05 ГОЛОС', ACC.voice]],
    ctaPrimary: 'ПОЛУЧИТЬ РАСЧЁТ →', ctaSecondary: 'О ПЛАТФОРМЕ',
    howKicker: '— КАК ЭТО РЕШАЕТ QODEQ', econKicker: '— ЭКОНОМИКА', stepsKicker: '— ВНЕДРЕНИЕ', faqKicker: '— FAQ', faqTitle: 'Частые вопросы',
    more: 'Подробнее →',
    formKicker: '— ЗАПРОСИТЬ РАСЧЁТ', formName: 'Имя', formCompany: 'Компания', formContact: 'Email или Telegram', formSend: 'ОТПРАВИТЬ ЗАЯВКУ',
    formNote: 'Ответим в течение рабочего дня. Telegram: @qodeq',
    sending: 'Отправляем…', sent: 'Спасибо! Ответим в течение рабочего дня.', need: 'Укажите имя и контакт.',
    fail: 'Не удалось отправить. Напишите нам в Telegram @qodeq.',
    relatedKicker: '— ДРУГИЕ РЕШЕНИЯ',
    footBack: '← QODEQ · AI-ПЛАТФОРМА ДЛЯ IGAMING', footProducts: 'Продукты', footSolutions: 'Решения', footResources: 'Ресурсы', resources: [['/ru/calculator', 'Калькулятор стоимости'], ['/ru/solutions/ai-customer-support-igaming', 'Обзор платформы'], ['/ru/blog', 'Блог']],
    products: [['/ru/chat', 'AI Chat Operator'], ['/ru/qa-chat', 'AI QA System'], ['/ru/payment', 'AI Payment Assistant'], ['/ru/qa-call', 'AI Voice QA'], ['/ru/voice', 'AI Voice Bot']],
  },
};

// ---------- страницы ----------
const PAGES = [
  {
    slug: 'online-casino-customer-support', acc: ACC.chat, product: 'Solutions · Online casino support',
    en: {
      nav: 'Online casinos',
      title: 'AI Customer Support for Online Casinos | QODEQ',
      desc: 'Automate online casino player support with AI: 65% of chats resolved without an operator, 7-second replies 24/7 in any language, 70%+ of payment tickets auto-resolved. Live in 15 days.',
      kicker: '— SOLUTIONS · ONLINE CASINOS',
      h1: 'AI customer support for online casinos',
      lead: 'QODEQ answers players in chat, resolves deposit and withdrawal questions and checks the quality of every conversation — on one platform built for casino operators. Your team keeps only the cases that really need a human.',
      stats: [['65%', 'of chats resolved without an operator'], ['7 sec', 'average response time, 24/7'], ['70%+', 'of payment tickets resolved automatically'], ['15 days', 'from integration to production']],
      probKicker: '— WHAT PLAYERS ASK',
      probTitle: 'The questions that fill a casino support queue — handled end to end.',
      problems: [
        ['“Where is my withdrawal?”', 'The Payment Assistant pulls the live transaction status straight from the PSP and answers in about 10 seconds. If something is stuck, it opens and enriches the ticket itself.'],
        ['“Why is my bonus not wagered?”', 'The Chat Operator checks the player’s progress against your bonus rules from the knowledge base and explains exactly what is left — no operator involved.'],
        ['KYC, limits and blocked accounts', 'Verification, limits and account blocks are resolved by your own flows, not routed. Anything sensitive goes to a human with the full context.'],
        ['“My deposit didn’t arrive”', 'Every ticket is matched against PSP data, including p2p transfers where the payer’s name rarely matches the account. PDF receipts are checked for forgery before a payout.'],
        ['Night shifts and traffic peaks', 'Thousands of simultaneous conversations with no queue, 24/7 — no extra shifts for tournaments, promos or weekends.'],
        ['Many markets, many languages', 'The agent replies in any language and in your brand’s tone of voice for each market.'],
      ],
      howTitle: 'Five AI agents on one platform — use one or all of them.',
      how: [
        ['chat', 'AI Chat Operator', 'Own generative model fine-tuned on 5M iGaming support chats. Resolves KYC, bonus, limit and payout questions end to end.'],
        ['payment', 'AI Payment Assistant', 'Live PSP data, automatic tickets and receipt forgery checks. Touches 90% of payment tickets, resolves 70%+ with no human.'],
        ['qa-chat', 'AI QA System', 'Scores 100% of operator chats on 15 criteria instead of a 10–15% sample, with daily per-operator reports.'],
        ['voice', 'AI Voice Bot', 'Outbound calls 24/7 in several languages: registration follow-ups, dormant player win-back, payout confirmation.'],
      ],
      econTitle: 'What it saves at 250,000 chats a month.',
      econ: [['Cost with operators only · 250,000 × $0.50', '$125,000'], ['Handled by AI (65%) · 162,500 × $0.18', '$29,250'], ['Handled by operators (35%) · 87,500 × $0.50', '$43,750'], ['Total cost with AI Chat Operator', '$73,000']],
      econTotal: [['Monthly savings', '$52,000'], ['Annual savings', '$624,000']],
      econNote: 'Billed per closed chat: $0.30 → $0.18 depending on volume, $1,000 one-off setup. A human operator costs $0.50 per chat on average.',
      stepsTitle: 'From integration to production in 15 days.',
      steps: [['DAY 1–5', 'Platform integration', 'API connection to your casino platform and helpdesk.'], ['DAY 5–10', 'Knowledge base upload', 'Rules, bonuses, KYC flows, tone of voice.'], ['DAY 10–15', 'Scenario testing', 'Shadow mode and calibration against your operators.'], ['DAY 15+', 'Production launch', 'Gradual traffic rollout with live supervision and rollback.']],
      faq: [
        ['How fast can AI support go live at our casino?', 'About 15 days: platform and helpdesk integration, knowledge-base upload, shadow-mode testing, then a gradual rollout. Backup operators stay on during the adaptation period and every step can be rolled back.'],
        ['Will AI replace our support team?', 'It takes over the repetitive majority — about 65% of chats and 70%+ of payment tickets. Complex, VIP and disputed cases go to your operators with the full conversation and player context.'],
        ['Which languages does the AI support?', 'Any language your players write in, with the tone of voice adapted to your brand in each market.'],
        ['How is AI customer support priced?', 'Per chat the agent closes — not per message or per seat: from $0.30 down to $0.18 per chat depending on monthly volume, plus a $1,000 one-off setup. Escalated chats are not double-charged.'],
        ['Is it just a wrapper around ChatGPT?', 'No. QODEQ runs its own generative model fine-tuned on 5 million iGaming support chats, not a wrapper over a public API.'],
        ['What does it integrate with?', 'Your casino platform and helpdesk via API, and your payment providers for transaction data. Rules, bonuses and flows are updated in the knowledge base without developers.'],
      ],
      ctaTitle: 'See the numbers for your casino.',
      ctaText: 'Leave a contact — we send a personalised calculation and a rollout plan within one business day.',
    },
    ru: {
      nav: 'Онлайн-казино',
      title: 'AI-поддержка для онлайн-казино | QODEQ',
      desc: 'Автоматизация поддержки игроков онлайн-казино: 65% чатов без оператора, ответ за 7 секунд 24/7 на любом языке, 70%+ платёжных тикетов закрываются автоматически. Запуск за 15 дней.',
      kicker: '— РЕШЕНИЯ · ОНЛАЙН-КАЗИНО',
      h1: 'AI-поддержка для онлайн-казино',
      lead: 'QODEQ отвечает игрокам в чате, закрывает вопросы по депозитам и выводам и проверяет качество каждого диалога — на одной платформе, созданной для операторов казино. Вашей команде остаются только случаи, где действительно нужен человек.',
      stats: [['65%', 'чатов закрывается без оператора'], ['7 сек', 'среднее время ответа, 24/7'], ['70%+', 'платёжных тикетов решается автоматически'], ['15 дней', 'от интеграции до запуска']],
      probKicker: '— О ЧЁМ СПРАШИВАЮТ ИГРОКИ',
      probTitle: 'Вопросы, которые забивают очередь саппорта казино, — решаются от начала до конца.',
      problems: [
        ['«Где мой вывод?»', 'Payment Assistant берёт живой статус транзакции прямо у платёжного провайдера и отвечает примерно за 10 секунд. Если платёж завис — сам создаёт и заполняет тикет.'],
        ['«Почему бонус не отыгран?»', 'Chat Operator сверяет прогресс игрока с правилами бонусов из базы знаний и объясняет, что осталось, — без участия оператора.'],
        ['KYC, лимиты и блокировки', 'Верификация, лимиты и блокировки аккаунта решаются по вашим сценариям, а не перекидываются на людей. Всё чувствительное уходит оператору с полным контекстом.'],
        ['«Депозит не пришёл»', 'Каждый тикет сверяется с данными PSP, включая p2p-переводы, где имя плательщика редко совпадает с аккаунтом. PDF-чеки проверяются на подделку до выплаты.'],
        ['Ночные смены и пиковые нагрузки', 'Тысячи диалогов одновременно без очереди, 24/7 — без дополнительных смен под турниры, акции и выходные.'],
        ['Много рынков и языков', 'Агент отвечает на любом языке и в тоне вашего бренда для каждого рынка.'],
      ],
      howTitle: 'Пять AI-агентов на одной платформе — подключайте один или все.',
      how: [
        ['chat', 'AI Chat Operator', 'Собственная генеративная модель, дообученная на 5 млн чатов поддержки iGaming. Закрывает вопросы KYC, бонусов, лимитов и выплат от начала до конца.'],
        ['payment', 'AI Payment Assistant', 'Живые данные PSP, автоматические тикеты и проверка чеков на подделку. Участвует в 90% платёжных тикетов, 70%+ решает без человека.'],
        ['qa-chat', 'AI QA System', 'Оценивает 100% чатов операторов по 15 критериям вместо выборки 10–15%, с ежедневными отчётами по каждому оператору.'],
        ['voice', 'AI Voice Bot', 'Исходящие звонки 24/7 на нескольких языках: дожим регистраций, возврат спящих игроков, подтверждение выплат.'],
      ],
      econTitle: 'Сколько это экономит при 250 000 чатов в месяц.',
      econ: [['Только операторы · 250 000 × $0,50', '$125 000'], ['Закрывает AI (65%) · 162 500 × $0,18', '$29 250'], ['Закрывают операторы (35%) · 87 500 × $0,50', '$43 750'], ['Итого с AI Chat Operator', '$73 000']],
      econTotal: [['Экономия в месяц', '$52 000'], ['Экономия в год', '$624 000']],
      econNote: 'Оплата за закрытый чат: от $0,30 до $0,18 в зависимости от объёма, разовый setup $1 000. Оператор-человек обходится в среднем в $0,50 за чат.',
      stepsTitle: 'От интеграции до запуска — 15 дней.',
      steps: [['ДНИ 1–5', 'Интеграция с платформой', 'API-подключение к платформе казино и хелпдеску.'], ['ДНИ 5–10', 'Загрузка базы знаний', 'Правила, бонусы, сценарии KYC, тон общения.'], ['ДНИ 10–15', 'Тестирование сценариев', 'Теневой режим и калибровка по вашим операторам.'], ['ДЕНЬ 15+', 'Запуск в продакшн', 'Постепенный перевод трафика под контролем, с возможностью отката.']],
      faq: [
        ['Как быстро можно запустить AI-поддержку в казино?', 'Около 15 дней: интеграция с платформой и хелпдеском, загрузка базы знаний, тест в теневом режиме и постепенный запуск. На период адаптации резервные операторы остаются, любой шаг можно откатить.'],
        ['AI заменит нашу службу поддержки?', 'Он забирает основную рутину — около 65% чатов и 70%+ платёжных тикетов. Сложные, VIP- и спорные обращения уходят вашим операторам с полной историей диалога и контекстом игрока.'],
        ['На каких языках работает AI?', 'На любом языке, на котором пишут ваши игроки, с тоном общения, адаптированным под ваш бренд на каждом рынке.'],
        ['Сколько стоит AI-поддержка?', 'Оплата за чат, который закрыл агент, — не за сообщения и не за места: от $0,30 до $0,18 за чат в зависимости от объёма в месяц плюс разовый setup $1 000. Эскалированные чаты повторно не тарифицируются.'],
        ['Это просто обёртка над ChatGPT?', 'Нет. У QODEQ собственная генеративная модель, дообученная на 5 миллионах чатов поддержки iGaming, а не надстройка над публичным API.'],
        ['С чем интегрируется платформа?', 'С платформой казино и хелпдеском по API и с платёжными провайдерами для данных о транзакциях. Правила, бонусы и сценарии обновляются в базе знаний без разработчиков.'],
      ],
      ctaTitle: 'Посчитаем экономию для вашего казино.',
      ctaText: 'Оставьте контакт — пришлём персональный расчёт и план внедрения в течение рабочего дня.',
    },
  },
  {
    slug: 'sportsbook-customer-support', acc: ACC.pay, product: 'Solutions · Sportsbook support',
    en: {
      nav: 'Sportsbooks',
      title: 'AI Customer Support for Sportsbooks & Betting | QODEQ',
      desc: 'AI support for sportsbooks: answer bettors 24/7 in any language, absorb match-day peaks with no queue, automate deposits, withdrawals and KYC. 65% of chats closed without an operator.',
      kicker: '— SOLUTIONS · SPORTSBOOKS & BETTING',
      h1: 'AI customer support for sportsbooks and betting operators',
      lead: 'Big match days bring traffic spikes no shift plan can cover. QODEQ answers bettors 24/7 in any language, handles payment and account questions, and hands disputed cases to your team with the full context.',
      stats: [['24/7', 'replies in any language'], ['7 sec', 'average response time'], ['65%', 'of chats closed without an operator'], ['0', 'queue at peak — thousands of chats at once']],
      probKicker: '— WHAT BETTORS ASK',
      probTitle: 'Where a betting support team loses time — and what the AI takes over.',
      problems: [
        ['Match-day and tournament peaks', 'Traffic jumps when the big games start. The agent handles thousands of simultaneous conversations with no queue — no emergency shifts.'],
        ['Questions about bet rules and settlement', 'Answers come from the betting rules and FAQs you keep in the knowledge base, updated without developers. Disputed settlements go to a human with the full history.'],
        ['“Where is my withdrawal?”', 'Live transaction status straight from the PSP, answered in about 10 seconds. Stuck payments get a ticket opened and enriched automatically.'],
        ['Deposits that “didn’t arrive”', 'Tickets are matched against PSP data, including p2p transfers; PDF receipts are checked for forgery before any payout.'],
        ['KYC, limits and blocked accounts', 'Verification and account restrictions are resolved by your own flows; sensitive cases escalate with context.'],
        ['Free bets and bonus conditions', 'The agent explains wagering and bonus terms from your rules, in the bettor’s language.'],
      ],
      howTitle: 'One platform for the whole betting support desk.',
      how: [
        ['chat', 'AI Chat Operator', 'Own model fine-tuned on 5M iGaming support chats. Resolves account, bonus and payout questions end to end, escalates with context.'],
        ['payment', 'AI Payment Assistant', 'Live PSP data, automatic tickets and receipt forgery checks — 70%+ of payment tickets resolved with no human.'],
        ['qa-chat', 'AI QA System', '100% of operator chats scored on 15 criteria, so peak-day quality is visible, not guessed.'],
        ['voice', 'AI Voice Bot', 'Outbound campaigns 24/7 in several languages — win back dormant bettors and confirm payouts without a call centre.'],
      ],
      econTitle: 'What it saves at 80,000 chats a month.',
      econ: [['Cost with operators only · 80,000 × $0.50', '$40,000'], ['Handled by AI (65%) · 52,000 × $0.20', '$10,400'], ['Handled by operators (35%) · 28,000 × $0.50', '$14,000'], ['Total cost with AI Chat Operator', '$24,400']],
      econTotal: [['Monthly savings', '$15,600'], ['Annual savings', '$187,200']],
      econNote: 'Billed per closed chat: $0.30 → $0.18 depending on volume, $1,000 one-off setup. A human operator costs $0.50 per chat on average.',
      stepsTitle: 'Live before the next big tournament: 15 days.',
      steps: [['DAY 1–5', 'Platform integration', 'API connection to your sportsbook platform and helpdesk.'], ['DAY 5–10', 'Knowledge base upload', 'Betting rules, bonuses, KYC flows, tone of voice.'], ['DAY 10–15', 'Scenario testing', 'Shadow mode and calibration against your operators.'], ['DAY 15+', 'Production launch', 'Gradual traffic rollout with live supervision and rollback.']],
      faq: [
        ['Can AI handle match-day traffic peaks?', 'Yes. The agent runs thousands of simultaneous conversations with no queue, so a derby or a final does not need extra shifts.'],
        ['What happens with disputed bets?', 'The agent explains your published rules; disputes and anything requiring a decision go to an operator with the full conversation and account context.'],
        ['Does it work for both sportsbook and casino?', 'Yes. QODEQ is built for casino, betting and lottery operators — one knowledge base and one platform cover all verticals.'],
        ['Which languages are supported?', 'Any language your bettors write in, with your brand’s tone of voice per market.'],
        ['How is it priced?', 'Per chat the agent closes: from $0.30 down to $0.18 per chat depending on volume, plus a $1,000 one-off setup. Escalated chats are not double-charged.'],
        ['How long does integration take?', 'About 15 days from API connection to production, with shadow-mode testing and a gradual, reversible rollout.'],
      ],
      ctaTitle: 'See the numbers for your sportsbook.',
      ctaText: 'Leave a contact — we send a personalised calculation and a rollout plan within one business day.',
    },
    ru: {
      nav: 'Букмекеры',
      title: 'AI-поддержка для букмекеров и беттинга | QODEQ',
      desc: 'AI-поддержка для букмекерских контор: ответы игрокам 24/7 на любом языке, пики в дни матчей без очереди, автоматизация депозитов, выводов и KYC. 65% чатов закрываются без оператора.',
      kicker: '— РЕШЕНИЯ · БУКМЕКЕРЫ И БЕТТИНГ',
      h1: 'AI-поддержка для букмекерских контор',
      lead: 'В дни больших матчей трафик растёт так, что никакой график смен не спасает. QODEQ отвечает игрокам 24/7 на любом языке, закрывает вопросы по платежам и аккаунтам и передаёт спорные случаи вашей команде с полным контекстом.',
      stats: [['24/7', 'ответы на любом языке'], ['7 сек', 'среднее время ответа'], ['65%', 'чатов закрывается без оператора'], ['0', 'очереди в пик — тысячи чатов одновременно']],
      probKicker: '— О ЧЁМ СПРАШИВАЮТ ИГРОКИ',
      probTitle: 'На что уходит время саппорта букмекера — и что забирает AI.',
      problems: [
        ['Пики в дни матчей и турниров', 'Трафик растёт со стартом больших игр. Агент ведёт тысячи диалогов одновременно без очереди — без экстренных смен.'],
        ['Вопросы о правилах и расчёте ставок', 'Ответы берутся из правил и FAQ, которые вы держите в базе знаний и обновляете без разработчиков. Спорные расчёты уходят человеку с полной историей.'],
        ['«Где мой вывод?»', 'Живой статус транзакции прямо от PSP, ответ примерно за 10 секунд. По зависшим платежам тикет создаётся и заполняется автоматически.'],
        ['Депозиты, которые «не пришли»', 'Тикеты сверяются с данными PSP, включая p2p-переводы; PDF-чеки проверяются на подделку до любой выплаты.'],
        ['KYC, лимиты и блокировки', 'Верификация и ограничения аккаунта решаются по вашим сценариям; чувствительные случаи эскалируются с контекстом.'],
        ['Фрибеты и условия бонусов', 'Агент объясняет условия отыгрыша и бонусов по вашим правилам — на языке игрока.'],
      ],
      howTitle: 'Одна платформа для всей поддержки букмекера.',
      how: [
        ['chat', 'AI Chat Operator', 'Собственная модель, дообученная на 5 млн чатов поддержки iGaming. Закрывает вопросы по аккаунтам, бонусам и выплатам, эскалирует с контекстом.'],
        ['payment', 'AI Payment Assistant', 'Живые данные PSP, автоматические тикеты и проверка чеков на подделку — 70%+ платёжных тикетов решаются без человека.'],
        ['qa-chat', 'AI QA System', '100% чатов операторов оцениваются по 15 критериям — качество в пиковые дни видно, а не угадывается.'],
        ['voice', 'AI Voice Bot', 'Исходящие кампании 24/7 на нескольких языках — возврат спящих игроков и подтверждение выплат без колл-центра.'],
      ],
      econTitle: 'Сколько это экономит при 80 000 чатов в месяц.',
      econ: [['Только операторы · 80 000 × $0,50', '$40 000'], ['Закрывает AI (65%) · 52 000 × $0,20', '$10 400'], ['Закрывают операторы (35%) · 28 000 × $0,50', '$14 000'], ['Итого с AI Chat Operator', '$24 400']],
      econTotal: [['Экономия в месяц', '$15 600'], ['Экономия в год', '$187 200']],
      econNote: 'Оплата за закрытый чат: от $0,30 до $0,18 в зависимости от объёма, разовый setup $1 000. Оператор-человек обходится в среднем в $0,50 за чат.',
      stepsTitle: 'Запуск до следующего большого турнира — 15 дней.',
      steps: [['ДНИ 1–5', 'Интеграция с платформой', 'API-подключение к платформе букмекера и хелпдеску.'], ['ДНИ 5–10', 'Загрузка базы знаний', 'Правила ставок, бонусы, сценарии KYC, тон общения.'], ['ДНИ 10–15', 'Тестирование сценариев', 'Теневой режим и калибровка по вашим операторам.'], ['ДЕНЬ 15+', 'Запуск в продакшн', 'Постепенный перевод трафика под контролем, с возможностью отката.']],
      faq: [
        ['Справится ли AI с пиками в дни матчей?', 'Да. Агент ведёт тысячи диалогов одновременно без очереди, так что дерби или финал не требуют дополнительных смен.'],
        ['Что происходит со спорными ставками?', 'Агент объясняет ваши опубликованные правила; споры и всё, что требует решения, уходит оператору с полной историей диалога и контекстом аккаунта.'],
        ['Подходит ли это и для беттинга, и для казино?', 'Да. QODEQ создан для операторов казино, ставок и лотерей — одна база знаний и одна платформа покрывают все вертикали.'],
        ['Какие языки поддерживаются?', 'Любой язык, на котором пишут ваши игроки, с тоном бренда для каждого рынка.'],
        ['Сколько это стоит?', 'Оплата за чат, который закрыл агент: от $0,30 до $0,18 за чат в зависимости от объёма плюс разовый setup $1 000. Эскалированные чаты повторно не тарифицируются.'],
        ['Сколько занимает интеграция?', 'Около 15 дней от подключения API до продакшна, с тестом в теневом режиме и постепенным обратимым запуском.'],
      ],
      ctaTitle: 'Посчитаем экономию для вашей букмекерской конторы.',
      ctaText: 'Оставьте контакт — пришлём персональный расчёт и план внедрения в течение рабочего дня.',
    },
  },
  {
    slug: 'customer-support-quality-assurance', acc: ACC.qa, product: 'Solutions · Support QA',
    en: {
      nav: 'Support QA',
      title: 'AI Support QA for iGaming — 100% of Chats & Calls | QODEQ',
      desc: 'AI quality assurance for iGaming support: 100% of chats scored on 15 criteria with 97.6% accuracy instead of a 10–15% sample, breaches pinned to the exact line, daily per-operator reports.',
      kicker: '— SOLUTIONS · SUPPORT QUALITY ASSURANCE',
      h1: 'Customer support QA for iGaming: every chat and call checked',
      lead: 'Manual QA reviews 10–15% of chats and about 2.6% of calls. QODEQ scores 100% of conversations on 15 weighted criteria, pins every breach to the exact line or second and sends daily reports for each operator.',
      stats: [['100%', 'of chats checked instead of a sample'], ['15', 'weighted criteria, tuned to your standards'], ['97.6%', 'scoring accuracy'], ['5 sec', 'per chat instead of 3–5 minutes']],
      probKicker: '— WHY MANUAL QA DOES NOT SCALE',
      probTitle: 'Sampling hides the problems that cost you players.',
      problems: [
        ['2 chats out of 1,000', 'A QA specialist checks a tiny sample. Rude replies, wrong bonus answers and missed escalations in the other 99% stay invisible.'],
        ['Slow and expensive', 'A manual review takes 3–5 minutes per chat and costs about $0.90 — and still covers only 10–15% of traffic.'],
        ['Calls are even worse', 'With 5,000 calls a day, 1–2 specialists hear about 128 of them. Full manual coverage would take 78 people.'],
        ['Subjective scores', 'Scores are calibrated against your QA managers, and their manual re-checks keep training the model.'],
        ['Coaching comes too late', 'Daily per-operator reports with the top strengths and development areas — teams lift performance by 25–40%.'],
        ['Sensitive data', 'Chats are processed confidentially with local storage and GDPR compliance; call recordings are encrypted.'],
      ],
      howTitle: 'Two agents, one scoring model for chats and calls.',
      how: [
        ['qa-chat', 'AI QA System — chats', 'Real-time scoring of every chat on 15 criteria, filtering by operator, shift and escalation, breach timestamps and monthly operator reports.'],
        ['qa-call', 'AI Voice QA — calls', 'Whisper transcription plus the same 15 criteria on every inbound and outbound call. Final stage of development: benefit proven in testing, terms on request.'],
        ['chat', 'AI Chat Operator', 'Pair QA with the AI agent: it closes about 65% of chats, QA watches the quality of the rest.'],
      ],
      econTitle: 'Savings against manual checking at $0.90 per chat.',
      econ: [['5,000 chats a month', '$3,000 · 67%'], ['50,000 chats a month', '$32,500 · 72%'], ['100,000 chats a month', '$70,000 · 78%'], ['200,000 chats a month', '$144,000 · 80%']],
      econTotal: [['Coverage', '100% instead of 10–15%'], ['Price per checked chat', '$0.30 → $0.18']],
      econNote: 'Monthly saving and % reduction versus manual QA at $0.90 per checked chat. Billed per checked chat — no per-seat licences, no minimum team size.',
      stepsTitle: 'Full operation from week 4.',
      steps: [['WEEK 1', 'Integration', 'Read-only access to your chat history (or call recordings for voice).'], ['WEEK 2', 'Assessment criteria', '15 criteria weighted to your standards and scripts.'], ['WEEK 3', 'Calibration', 'Scores aligned with your QA managers in a parallel run.'], ['WEEK 4+', 'Full operation', 'Daily per-operator reports and coaching plans.']],
      faq: [
        ['Does AI replace our QA team?', 'It replaces the manual sampling. QA managers move to calibration, re-checks and coaching — the work that actually improves operators.'],
        ['Can we use our own QA criteria?', 'Yes. Each of the 15 criteria has a weighting coefficient adapted to your project, brand and scripts.'],
        ['How accurate is AI scoring?', '97.6% accuracy, and every finding links to the exact line in the chat or second in the call, so any score can be verified.'],
        ['Is our data safe?', 'Chats are processed confidentially with local storage and GDPR compliance. Call recordings are encrypted and processed locally.'],
        ['Is call QA available now?', 'AI Voice QA is in the final stage of development and comprehensive testing; its economic benefit is already proven in the test environment. Terms depend on call volume.'],
        ['How is chat QA priced?', 'Per checked chat: from $0.30 down to $0.18 depending on monthly volume. No per-seat licences and no minimum team size.'],
      ],
      ctaTitle: 'See what 100% QA coverage costs for your volumes.',
      ctaText: 'Leave a contact — we send a personalised calculation and a rollout plan within one business day.',
    },
    ru: {
      nav: 'Контроль качества',
      title: 'AI-контроль качества поддержки iGaming | QODEQ',
      desc: 'AI-контроль качества поддержки iGaming: 100% чатов по 15 критериям с точностью 97,6% вместо выборки 10–15%, нарушения с привязкой к строке, ежедневные отчёты по операторам.',
      kicker: '— РЕШЕНИЯ · КОНТРОЛЬ КАЧЕСТВА ПОДДЕРЖКИ',
      h1: 'Контроль качества поддержки iGaming: проверка каждого чата и звонка',
      lead: 'Ручной QA проверяет 10–15% чатов и около 2,6% звонков. QODEQ оценивает 100% диалогов по 15 взвешенным критериям, привязывает каждое нарушение к конкретной строке или секунде и присылает ежедневные отчёты по каждому оператору.',
      stats: [['100%', 'чатов проверяется вместо выборки'], ['15', 'взвешенных критериев под ваши стандарты'], ['97,6%', 'точность оценки'], ['5 сек', 'на чат вместо 3–5 минут']],
      probKicker: '— ПОЧЕМУ РУЧНОЙ QA НЕ МАСШТАБИРУЕТСЯ',
      probTitle: 'Выборка скрывает проблемы, из-за которых вы теряете игроков.',
      problems: [
        ['2 чата из 1 000', 'QA-специалист видит крошечную выборку. Грубые ответы, ошибки по бонусам и пропущенные эскалации в остальных 99% остаются незамеченными.'],
        ['Медленно и дорого', 'Ручная проверка занимает 3–5 минут на чат и стоит около $0,90 — и всё равно покрывает лишь 10–15% трафика.'],
        ['Со звонками ещё хуже', 'При 5 000 звонков в день 1–2 специалиста слушают около 128 из них. Для полного ручного покрытия понадобилось бы 78 человек.'],
        ['Субъективные оценки', 'Оценки калибруются по вашим QA-менеджерам, а их ручные перепроверки продолжают обучать модель.'],
        ['Обратная связь слишком поздно', 'Ежедневные отчёты по каждому оператору с сильными сторонами и зонами роста — команды поднимают показатели на 25–40%.'],
        ['Чувствительные данные', 'Чаты обрабатываются конфиденциально, с локальным хранением и соблюдением GDPR; записи звонков шифруются.'],
      ],
      howTitle: 'Два агента и одна модель оценки для чатов и звонков.',
      how: [
        ['qa-chat', 'AI QA System — чаты', 'Оценка каждого чата по 15 критериям в реальном времени, фильтры по оператору, смене и эскалациям, таймкоды нарушений и ежемесячные отчёты.'],
        ['qa-call', 'AI Voice QA — звонки', 'Транскрибация Whisper и те же 15 критериев для каждого входящего и исходящего звонка. Финальная стадия разработки: эффект подтверждён на тестах, условия по запросу.'],
        ['chat', 'AI Chat Operator', 'Объедините QA с AI-агентом: он закрывает около 65% чатов, а QA следит за качеством остальных.'],
      ],
      econTitle: 'Экономия по сравнению с ручной проверкой по $0,90 за чат.',
      econ: [['5 000 чатов в месяц', '$3 000 · 67%'], ['50 000 чатов в месяц', '$32 500 · 72%'], ['100 000 чатов в месяц', '$70 000 · 78%'], ['200 000 чатов в месяц', '$144 000 · 80%']],
      econTotal: [['Покрытие', '100% вместо 10–15%'], ['Цена за проверенный чат', '$0,30 → $0,18']],
      econNote: 'Экономия в месяц и % снижения затрат против ручного QA по $0,90 за проверенный чат. Оплата за проверенный чат — без лицензий на места и минимального размера команды.',
      stepsTitle: 'Полноценная работа с 4-й недели.',
      steps: [['НЕДЕЛЯ 1', 'Интеграция', 'Доступ только на чтение к истории чатов (или к записям звонков для голоса).'], ['НЕДЕЛЯ 2', 'Критерии оценки', '15 критериев, взвешенных под ваши стандарты и скрипты.'], ['НЕДЕЛЯ 3', 'Калибровка', 'Оценки сверяются с вашими QA-менеджерами в параллельном режиме.'], ['НЕДЕЛЯ 4+', 'Полная работа', 'Ежедневные отчёты по операторам и планы обучения.']],
      faq: [
        ['AI заменит нашу QA-команду?', 'Он заменяет ручную выборку. QA-менеджеры переходят на калибровку, перепроверки и обучение — работу, которая реально улучшает операторов.'],
        ['Можно использовать свои критерии качества?', 'Да. У каждого из 15 критериев есть весовой коэффициент, настроенный под ваш проект, бренд и скрипты.'],
        ['Насколько точна AI-оценка?', 'Точность 97,6%, а каждое замечание ссылается на конкретную строку чата или секунду звонка, так что любую оценку можно проверить.'],
        ['Наши данные в безопасности?', 'Чаты обрабатываются конфиденциально, с локальным хранением и соблюдением GDPR. Записи звонков шифруются и обрабатываются локально.'],
        ['Контроль качества звонков уже доступен?', 'AI Voice QA на финальной стадии разработки и комплексного тестирования; экономический эффект уже подтверждён в тестовой среде. Условия зависят от объёма звонков.'],
        ['Сколько стоит QA чатов?', 'Оплата за проверенный чат: от $0,30 до $0,18 в зависимости от объёма в месяц. Без лицензий на места и минимального размера команды.'],
      ],
      ctaTitle: 'Посчитаем стоимость 100% контроля качества для ваших объёмов.',
      ctaText: 'Оставьте контакт — пришлём персональный расчёт и план внедрения в течение рабочего дня.',
    },
  },
];

// ---------- анимированные демо в hero (рендерятся скриптом, в индекс не попадают) ----------
// type 'chat': сценарии диалога; type 'qa': оценка одного диалога по критериям.
const DEMOS = {
  'online-casino-customer-support': {
    type: 'chat',
    en: { title: 'QODEQ · AI CHAT OPERATOR', note: 'ILLUSTRATIVE DEMO', online: 'ONLINE', player: 'PLAYER', agent: 'AI AGENT', scenarios: [
      { tab: 'WITHDRAWAL', q: 'Where is my withdrawal? It’s been 3 hours.', chips: ['PSP status lookup', 'Wagering: closed', 'No ticket needed'], a: 'Your €400 withdrawal to Skrill is already with the provider — it should arrive in about 40 minutes. Nothing on our side is blocking it.', meta: 'RESOLVED IN 9 S · NO OPERATOR' },
      { tab: 'BONUS', q: 'Why can’t I withdraw my bonus winnings?', chips: ['Bonus rules · knowledge base', 'Wagering progress: 82%'], a: 'You’ve wagered €1,640 of the €2,000 required for this bonus — €360 to go. After that the whole balance becomes withdrawable.', meta: 'RESOLVED IN 7 S · NO OPERATOR' },
      { tab: 'KYC', q: 'My account is blocked. What do I do?', chips: ['Account status: KYC pending', 'KYC flow · step 2 of 3'], a: 'Your account is paused until verification is complete. Upload a photo of your ID using the link below and we’ll notify you by email once it’s reviewed.', meta: 'RESOLVED IN 6 S · NO OPERATOR' },
    ] },
    ru: { title: 'QODEQ · AI CHAT OPERATOR', note: 'ДЕМО-ПРИМЕР', online: 'ОНЛАЙН', player: 'ИГРОК', agent: 'AI-АГЕНТ', scenarios: [
      { tab: 'ВЫВОД', q: 'Где мой вывод? Прошло уже 3 часа.', chips: ['Статус в PSP', 'Отыгрыш: закрыт', 'Тикет не нужен'], a: 'Ваш вывод €400 на Skrill уже у платёжного провайдера — поступит примерно через 40 минут. С нашей стороны ничего его не блокирует.', meta: 'РЕШЕНО ЗА 9 С · БЕЗ ОПЕРАТОРА' },
      { tab: 'БОНУС', q: 'Почему я не могу вывести выигрыш с бонуса?', chips: ['Правила бонусов · база знаний', 'Прогресс отыгрыша: 82%'], a: 'Вы отыграли €1 640 из €2 000, нужных для этого бонуса, — осталось €360. После этого весь баланс станет доступен к выводу.', meta: 'РЕШЕНО ЗА 7 С · БЕЗ ОПЕРАТОРА' },
      { tab: 'KYC', q: 'Мой аккаунт заблокирован. Что делать?', chips: ['Статус: ожидает KYC', 'Сценарий KYC · шаг 2 из 3'], a: 'Аккаунт приостановлен до завершения верификации. Загрузите фото документа по ссылке ниже — мы сообщим на email, как только проверим.', meta: 'РЕШЕНО ЗА 6 С · БЕЗ ОПЕРАТОРА' },
    ] },
  },
  'sportsbook-customer-support': {
    type: 'chat',
    en: { title: 'QODEQ · AI CHAT OPERATOR', note: 'ILLUSTRATIVE DEMO', online: 'ONLINE', player: 'BETTOR', agent: 'AI AGENT', scenarios: [
      { tab: 'VOID BET', q: 'Why was my bet on the match voided?', chips: ['Bet history lookup', 'Rule: postponed match · knowledge base'], a: 'The match was postponed by more than 48 hours, so under the betting rules the bet is void. Your €50 stake is already back on your balance.', meta: 'RESOLVED IN 8 S · NO OPERATOR' },
      { tab: 'WITHDRAWAL', q: 'My withdrawal is still pending after the final!', chips: ['PSP status lookup', 'Peak load · no queue'], a: 'Your €1,200 withdrawal is approved and already with the payment provider — it should arrive within the hour.', meta: 'RESOLVED IN 7 S · NO OPERATOR' },
      { tab: 'FREE BET', q: 'How do I use my free bet?', chips: ['Bonus rules · knowledge base', 'Free bet: €10 · min odds 1.80'], a: 'Your €10 free bet is active: place it on any pre-match selection at odds of 1.80 or higher before Sunday. Winnings are paid without the stake.', meta: 'RESOLVED IN 6 S · NO OPERATOR' },
    ] },
    ru: { title: 'QODEQ · AI CHAT OPERATOR', note: 'ДЕМО-ПРИМЕР', online: 'ОНЛАЙН', player: 'ИГРОК', agent: 'AI-АГЕНТ', scenarios: [
      { tab: 'ВОЗВРАТ', q: 'Почему мою ставку на матч рассчитали как возврат?', chips: ['История ставок', 'Правило: перенос матча · база знаний'], a: 'Матч перенесли больше чем на 48 часов, поэтому по правилам ставка аннулирована. Ваши €50 уже вернулись на баланс.', meta: 'РЕШЕНО ЗА 8 С · БЕЗ ОПЕРАТОРА' },
      { tab: 'ВЫВОД', q: 'Вывод всё ещё висит после финала!', chips: ['Статус в PSP', 'Пиковая нагрузка · без очереди'], a: 'Ваш вывод €1 200 одобрен и уже у платёжного провайдера — поступит в течение часа.', meta: 'РЕШЕНО ЗА 7 С · БЕЗ ОПЕРАТОРА' },
      { tab: 'ФРИБЕТ', q: 'Как использовать фрибет?', chips: ['Правила бонусов · база знаний', 'Фрибет: €10 · мин. кэф 1.80'], a: 'Фрибет €10 активен: поставьте его на любой прематч-исход с коэффициентом от 1.80 до воскресенья. Выигрыш выплачивается без суммы ставки.', meta: 'РЕШЕНО ЗА 6 С · БЕЗ ОПЕРАТОРА' },
    ] },
  },
  'customer-support-quality-assurance': {
    type: 'qa',
    en: { title: 'QODEQ · AI QA · CHAT #48,112', note: 'ILLUSTRATIVE DEMO', live: 'AUTO-SCORING', score: 'SCORE', checked: 'CHECKED IN 5 SEC · 15 CRITERIA',
      lines: [['PLAYER', 'My withdrawal has been pending for 3 hours.'], ['OPERATOR', 'Hello! Could you confirm the e-mail on the account?'], ['OPERATOR', '€400 to Skrill is with the provider, ETA 40 minutes.']],
      criteria: [['Greeting & identification', 96], ['Knowledge-base accuracy', 99], ['Acknowledging the wait', 41, '00:42 · No acknowledgement of a 3 h wait'], ['Tone of voice', 88], ['Resolution', 94]], total: 84 },
    ru: { title: 'QODEQ · AI QA · ЧАТ #48 112', note: 'ДЕМО-ПРИМЕР', live: 'АВТООЦЕНКА', score: 'ОЦЕНКА', checked: 'ПРОВЕРЕНО ЗА 5 С · 15 КРИТЕРИЕВ',
      lines: [['ИГРОК', 'Мой вывод висит уже 3 часа.'], ['ОПЕРАТОР', 'Здравствуйте! Подтвердите, пожалуйста, email аккаунта.'], ['ОПЕРАТОР', '€400 на Skrill у провайдера, поступят через 40 минут.']],
      criteria: [['Приветствие и идентификация', 96], ['Точность по базе знаний', 99], ['Признание ожидания', 41, '00:42 · Не признал ожидание в 3 часа'], ['Тон общения', 88], ['Решение вопроса', 94]], total: 84 },
  },
};

// Полосы сравнения в блоке экономики (ширина в % от максимума).
const BARS = {
  'online-casino-customer-support': {
    en: [['Operators only', 100, '$125,000'], ['With QODEQ', 58, '$73,000']],
    ru: [['Только операторы', 100, '$125 000'], ['С QODEQ', 58, '$73 000']],
  },
  'sportsbook-customer-support': {
    en: [['Operators only', 100, '$40,000'], ['With QODEQ', 61, '$24,400']],
    ru: [['Только операторы', 100, '$40 000'], ['С QODEQ', 61, '$24 400']],
  },
  'customer-support-quality-assurance': {
    en: [['Cost cut at 5K chats', 67, '−67%'], ['at 50K chats', 72, '−72%'], ['at 100K chats', 78, '−78%'], ['at 200K chats', 80, '−80%']],
    ru: [['Снижение при 5K чатов', 67, '−67%'], ['при 50K чатов', 72, '−72%'], ['при 100K чатов', 78, '−78%'], ['при 200K чатов', 80, '−80%']],
  },
};

// ---------- шаблон ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urlOf = (lang, slug) => `${SITE}${UI[lang].prefix}/solutions/${slug}`;
const pathOf = (lang, slug) => `${UI[lang].prefix}/solutions/${slug}`;
const prodHref = (lang, key) => `${UI[lang].prefix}/${key}`;
const PROD_ACC = { chat: ACC.chat, 'qa-chat': ACC.qa, payment: ACC.pay, 'qa-call': ACC.qacall, voice: ACC.voice };

const CSS = `
  :root { --bg: #0A0A09; --bg2: #0C0C0A; --bg3: #11110F; --text: #F5F2EC; --text2: #E8E6E1; --muted: #8A8579; --dim: #6E6A61; --faint: #57544C;
    --line: rgba(255,255,255,.09); --line2: rgba(255,255,255,.14); --acc: #E8B23A;
    --mono: 'JetBrains Mono', ui-monospace, monospace; --sans: 'Space Grotesk', system-ui, sans-serif; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--sans); overflow-x: hidden; }
  body::before { content: ''; position: fixed; left: 50%; top: -20vh; width: 90vw; height: 70vh; transform: translateX(-50%); background: radial-gradient(ellipse, color-mix(in srgb, var(--page-acc) 9%, transparent), transparent 65%); pointer-events: none; z-index: 0; }
  a { color: inherit; text-decoration: none; }
  p { margin: 0; }
  .btn, .nav a, .lang a { cursor: pointer; transition: background-color .15s ease, color .15s ease, border-color .15s ease, filter .15s ease; }
  .btn:hover, .nav a:hover, .lang a:hover { background-color: var(--btn-acc, var(--page-acc)) !important; border-color: var(--btn-acc, var(--page-acc)) !important; color: #0A0A09 !important; }
  .btn:active { filter: brightness(.82); }
  .hdr { position: fixed; top: 0; left: 0; right: 0; z-index: 90; display: flex; flex-wrap: wrap; align-items: center; gap: 14px 18px; padding: 16px 32px; background: rgba(10,10,9,.78); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.07); }
  .hdr img { height: 40px; width: auto; display: block; }
  .nav { display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto; font: 400 10px/1 var(--mono); letter-spacing: .16em; }
  .nav a { padding: 8px 12px; border: 1px solid var(--line2); color: var(--muted); }
  .lang { display: flex; gap: 6px; }
  .lang a { padding: 7px 11px; border: 1px solid rgba(255,255,255,.16); color: var(--muted); font: 400 10px/1 var(--mono); letter-spacing: .16em; }
  .lang a[aria-current] { background: color-mix(in srgb, var(--page-acc) 14%, transparent); border-color: var(--page-acc); color: var(--page-acc); }
  main { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 0 clamp(18px, 4vw, 48px); }
  section { padding: clamp(56px, 9vw, 110px) 0 0; }
  .kicker { margin: 0 0 18px; font: 400 11px/1.4 var(--mono); letter-spacing: .24em; color: var(--page-acc); }
  h1 { margin: 0 0 26px; max-width: 980px; font: 500 clamp(34px, 5.4vw, 72px)/1.02 var(--sans); letter-spacing: -.032em; }
  h2 { margin: 0 0 40px; max-width: 900px; font: 500 clamp(26px, 3.4vw, 46px)/1.06 var(--sans); letter-spacing: -.026em; }
  h3 { margin: 0 0 10px; font: 500 19px/1.25 var(--sans); letter-spacing: -.01em; color: var(--text); }
  .lead { max-width: 760px; font: 400 clamp(16px, 1.5vw, 19px)/1.55 var(--sans); color: #B5AFA2; }
  .hero { padding-top: calc(73px + clamp(56px, 9vw, 120px)); }
  .ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 36px; }
  .btn { display: inline-flex; align-items: center; padding: 16px 22px; border: 1px solid var(--line2); color: var(--text2); font: 500 11px/1 var(--mono); letter-spacing: .18em; background: transparent; }
  .btn.primary { background: var(--page-acc); border-color: var(--page-acc); color: #0A0A09; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin-top: clamp(48px, 7vw, 80px); background: var(--line); border: 1px solid var(--line); }
  .stat { padding: 26px 22px; background: var(--bg); }
  .stat b { display: block; margin-bottom: 10px; font: 500 clamp(30px, 3.4vw, 44px)/1 var(--sans); letter-spacing: -.03em; color: var(--page-acc); }
  .stat span { font: 400 11px/1.5 var(--mono); letter-spacing: .1em; color: var(--muted); text-transform: uppercase; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .cell { padding: 28px 26px; background: var(--bg); }
  .cell p { font: 400 15px/1.6 var(--sans); color: #9A958A; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .card { display: flex; flex-direction: column; gap: 14px; padding: 28px 24px; background: var(--bg2); border-top: 2px solid var(--card-acc); transition: background-color .2s ease, transform .2s ease; }
  .card:hover { background: #0E0E0C; transform: translateY(-3px); }
  .card p { flex: 1; font: 400 14px/1.6 var(--sans); color: #9A958A; }
  .card .more { font: 500 10px/1 var(--mono); letter-spacing: .16em; color: var(--card-acc); }
  .econ { display: grid; grid-template-columns: 1.3fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .econ table { width: 100%; border-collapse: collapse; background: var(--bg); }
  .econ td { padding: 18px 24px; border-bottom: 1px solid var(--line); font: 400 13px/1.4 var(--mono); color: var(--text2); }
  .econ td + td { text-align: right; white-space: nowrap; color: var(--text); }
  .econ tr:last-child td { border-bottom: 0; color: var(--text); font-weight: 500; }
  .econ .tot { display: flex; flex-direction: column; justify-content: center; gap: 26px; padding: 28px; background: var(--bg2); }
  .econ .tot span { display: block; margin-bottom: 8px; font: 400 10px/1 var(--mono); letter-spacing: .2em; color: var(--muted); text-transform: uppercase; }
  .econ .tot b { font: 500 clamp(28px, 3.2vw, 42px)/1 var(--sans); letter-spacing: -.03em; color: var(--page-acc); }
  .note { margin-top: 16px; max-width: 900px; font: 400 12px/1.6 var(--mono); color: var(--dim); }
  .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .step { padding: 26px 22px; background: var(--bg); }
  .step i { display: block; margin-bottom: 16px; font: 500 10px/1 var(--mono); font-style: normal; letter-spacing: .2em; color: var(--page-acc); }
  .step p { font: 400 14px/1.55 var(--sans); color: #9A958A; }
  .faq { border-top: 1px solid var(--line); }
  .faq details { border-bottom: 1px solid var(--line); }
  .faq summary { display: flex; justify-content: space-between; gap: 24px; padding: 24px 0; cursor: pointer; list-style: none; font: 500 clamp(17px, 1.6vw, 21px)/1.35 var(--sans); color: var(--text); }
  .faq summary::-webkit-details-marker { display: none; }
  .faq summary::after { content: '+'; flex: 0 0 auto; font: 400 22px/1 var(--mono); color: var(--page-acc); transition: transform .2s ease; }
  .faq details[open] summary::after { transform: rotate(45deg); }
  .faq details p { max-width: 860px; padding: 0 0 26px; font: 400 16px/1.65 var(--sans); color: #9A958A; }
  .contact { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .contact > div, .contact form { padding: clamp(28px, 4vw, 48px); }
  .contact > div { background: var(--bg2); }
  .contact form { position: relative; display: flex; flex-direction: column; justify-content: center; gap: 10px; background: var(--bg); }
  .contact input { width: 100%; padding: 15px 16px; background: var(--bg3); border: 1px solid var(--line2); color: var(--text); font: 400 15px/1.2 var(--sans); border-radius: 0; }
  .contact input:focus { outline: none; border-color: var(--page-acc); }
  .contact .hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
  .contact .btn { justify-content: center; margin-top: 6px; }
  .contact .msg { min-height: 1.4em; font: 400 12px/1.5 var(--mono); color: var(--muted); }
  .contact .msg.ok { color: #4FD1A5; } .contact .msg.err { color: #F4794C; }
  .contact .small { margin-top: 18px; font: 400 12px/1.6 var(--mono); color: var(--dim); }
  .related { display: flex; flex-wrap: wrap; gap: 10px; }
  footer { position: relative; z-index: 1; max-width: 1280px; margin: clamp(70px, 10vw, 120px) auto 0; padding: 40px clamp(18px, 4vw, 48px) 48px; border-top: 1px solid var(--line); display: flex; flex-wrap: wrap; justify-content: space-between; gap: 30px; font: 400 13px/1.9 var(--sans); color: #9A958A; }
  footer .col span { display: block; margin-bottom: 8px; font: 400 10px/1 var(--mono); letter-spacing: .2em; color: var(--faint); text-transform: uppercase; }
  footer .col a { display: block; }
  footer .col a:hover, footer .back:hover { color: var(--text); }
  footer .back { font: 400 11px/1.6 var(--mono); letter-spacing: .14em; color: var(--faint); }
  @media (max-width: 980px) { .stats, .steps { grid-template-columns: 1fr 1fr; } .grid { grid-template-columns: 1fr 1fr; } .econ, .contact { grid-template-columns: 1fr; } }
  @media (max-width: 860px) { .nav { display: none; } .hdr { padding: 12px 16px; } .hdr .lang { margin-left: auto; } .hero { padding-top: calc(65px + 48px); } }
  @media (max-width: 560px) { .stats, .steps, .grid { grid-template-columns: 1fr; } .econ td { padding: 14px 16px; } }

  /* ---------- hero: текст + живое демо, анимированная сетка ---------- */
  .hero { position: relative; display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr); gap: clamp(32px, 4vw, 64px); align-items: center; }
  .hero .stats { grid-column: 1 / -1; }
  .hero h1 { font-size: clamp(34px, 4.6vw, 64px); }
  .hero-bg { position: absolute; inset: -40px -20vw auto; height: 760px; z-index: -1; pointer-events: none;
    background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
    background-size: 56px 56px; -webkit-mask-image: radial-gradient(ellipse 60% 55% at 62% 42%, #000 20%, transparent 75%); mask-image: radial-gradient(ellipse 60% 55% at 62% 42%, #000 20%, transparent 75%);
    animation: grid-drift 22s linear infinite; }
  @keyframes grid-drift { to { background-position: 56px 56px, 56px 56px; } }
  .hero-bg::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 120px; background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--page-acc) 10%, transparent), transparent); animation: scan 7s ease-in-out infinite; }
  @keyframes scan { 0% { transform: translateY(-120px); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(760px); opacity: 0; } }

  /* ---------- демо-виджет ---------- */
  .demo { position: relative; display: flex; flex-direction: column; min-height: 470px; background: rgba(12,12,10,.88); border: 1px solid var(--line2); box-shadow: 0 30px 80px -30px color-mix(in srgb, var(--page-acc) 35%, transparent); backdrop-filter: blur(6px); }
  .demo::before { content: ''; position: absolute; inset: -1px; border: 1px solid var(--page-acc); opacity: .35; pointer-events: none; -webkit-mask-image: linear-gradient(135deg, #000, transparent 40%, transparent 60%, #000); mask-image: linear-gradient(135deg, #000, transparent 40%, transparent 60%, #000); }
  .demo-hd { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--line); font: 400 10px/1 var(--mono); letter-spacing: .16em; color: var(--muted); }
  .demo-hd > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .demo-hd .live { margin-left: auto; display: flex; align-items: center; gap: 7px; color: var(--page-acc); white-space: nowrap; }
  .demo-hd .live i { width: 7px; height: 7px; border-radius: 50%; background: var(--page-acc); animation: pulse 1.8s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--page-acc) 60%, transparent); } 50% { box-shadow: 0 0 0 6px transparent; } }
  .demo-body { flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 18px; overflow: hidden; }
  .demo-ft { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 18px; border-top: 1px solid var(--line); font: 400 9px/1.4 var(--mono); letter-spacing: .16em; color: var(--faint); }
  .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
  .tabs button { padding: 7px 10px; background: transparent; border: 1px solid var(--line2); color: var(--muted); font: 400 9px/1 var(--mono); letter-spacing: .14em; cursor: pointer; transition: color .2s, border-color .2s, background-color .2s; }
  .tabs button[aria-pressed="true"] { color: #0A0A09; background: var(--page-acc); border-color: var(--page-acc); }
  .msg-row { display: flex; flex-direction: column; gap: 5px; max-width: 88%; animation: pop .45s cubic-bezier(.2,.7,.2,1) both; }
  .msg-row.ai { align-self: flex-end; align-items: flex-end; }
  .msg-row small { font: 400 9px/1 var(--mono); letter-spacing: .16em; color: var(--faint); }
  .bubble { padding: 12px 14px; background: var(--bg3); border: 1px solid var(--line); font: 400 14px/1.5 var(--sans); color: var(--text2); }
  .msg-row.ai .bubble { background: color-mix(in srgb, var(--page-acc) 10%, var(--bg2)); border-color: color-mix(in srgb, var(--page-acc) 40%, transparent); color: var(--text); }
  .bubble .caret { display: inline-block; width: 7px; height: 14px; margin-left: 2px; vertical-align: -2px; background: var(--page-acc); animation: blink .8s steps(2) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  .typing { display: inline-flex; gap: 4px; padding: 14px; }
  .typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--page-acc); animation: dot 1s ease-in-out infinite; }
  .typing i:nth-child(2) { animation-delay: .15s; } .typing i:nth-child(3) { animation-delay: .3s; }
  @keyframes dot { 0%, 100% { opacity: .25; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
  .chips { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; align-self: flex-end; max-width: 92%; }
  .chip { display: inline-flex; align-items: center; gap: 7px; padding: 6px 9px; border: 1px dashed var(--line2); font: 400 10px/1 var(--mono); letter-spacing: .06em; color: var(--muted); animation: pop .35s cubic-bezier(.2,.7,.2,1) both; }
  .chip b { color: var(--page-acc); font-weight: 400; }
  .meta { align-self: flex-end; font: 500 10px/1 var(--mono); letter-spacing: .16em; color: var(--page-acc); animation: pop .4s ease both; }
  @keyframes pop { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
  .fade-out { transition: opacity .45s ease; opacity: 0; }

  /* qa-демо */
  .qa-lines { display: flex; flex-direction: column; gap: 8px; }
  .qa-line { display: grid; grid-template-columns: 84px 1fr; gap: 10px; padding: 9px 10px; border: 1px solid var(--line); font: 400 13px/1.45 var(--sans); color: var(--text2); animation: pop .4s ease both; }
  .qa-line small { font: 400 9px/1.6 var(--mono); letter-spacing: .14em; color: var(--faint); }
  .qa-line.flag { border-color: #F4794C; background: rgba(244,121,76,.07); transition: border-color .3s, background-color .3s; }
  .crit { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .crit-row { display: grid; grid-template-columns: 1fr 120px 34px; align-items: center; gap: 12px; font: 400 11px/1.3 var(--mono); color: var(--muted); }
  .crit-row .track { height: 4px; background: rgba(255,255,255,.07); }
  .crit-row .track i { display: block; height: 4px; width: 0; background: var(--page-acc); transition: width 1s cubic-bezier(.2,.7,.2,1); }
  .crit-row.bad .track i { background: #F4794C; } .crit-row.bad { color: #F4794C; }
  .crit-row b { font-weight: 500; color: var(--text); text-align: right; }
  .flag-note { padding: 8px 10px; border-left: 2px solid #F4794C; font: 400 11px/1.4 var(--mono); color: #F4794C; background: rgba(244,121,76,.06); animation: pop .4s ease both; }
  .qa-score { display: flex; align-items: baseline; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line); }
  .qa-score span { font: 400 10px/1 var(--mono); letter-spacing: .18em; color: var(--muted); }
  .qa-score b { font: 500 40px/1 var(--sans); letter-spacing: -.03em; color: var(--page-acc); }

  /* ---------- полосы экономики ---------- */
  .bars { display: flex; flex-direction: column; gap: 14px; margin-top: 1px; padding: 26px 24px; background: var(--bg); border: 1px solid var(--line); border-top: 0; }
  .bar-row { display: grid; grid-template-columns: minmax(130px, 220px) 1fr 110px; align-items: center; gap: 16px; font: 400 12px/1.3 var(--mono); color: var(--muted); }
  .bar-row .track { height: 10px; background: rgba(255,255,255,.05); }
  .bar-row .track i { display: block; height: 10px; width: 0; background: rgba(255,255,255,.22); transition: width 1.4s cubic-bezier(.2,.7,.2,1); }
  .bar-row.hl .track i { background: var(--page-acc); }
  .bar-row b { font: 500 15px/1 var(--sans); color: var(--text); text-align: right; }
  .bars.in .bar-row .track i { width: var(--w); }
  .bars .bar-row:nth-child(2) .track i { transition-delay: .15s; } .bars .bar-row:nth-child(3) .track i { transition-delay: .3s; } .bars .bar-row:nth-child(4) .track i { transition-delay: .45s; }

  /* ---------- таймлайн внедрения ---------- */
  .steps { position: relative; }
  .steps::before { content: ''; position: absolute; left: 0; right: 0; top: -1px; height: 2px; background: var(--page-acc); transform: scaleX(0); transform-origin: left; transition: transform 1.6s cubic-bezier(.2,.7,.2,1); z-index: 1; }
  .steps.in::before { transform: scaleX(1); }
  .step i::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 10px; border: 1px solid var(--page-acc); vertical-align: 0; transition: background-color .3s ease; }
  .steps.in .step i::before { background: var(--page-acc); }
  .steps.in .step:nth-child(2) i::before { transition-delay: .4s; } .steps.in .step:nth-child(3) i::before { transition-delay: .8s; } .steps.in .step:nth-child(4) i::before { transition-delay: 1.2s; }

  /* ---------- появление при прокрутке ---------- */
  .js [data-r] { opacity: 0; transform: translateY(22px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); transition-delay: var(--d, 0s); }
  .js [data-r].in { opacity: 1; transform: none; }
  .cell, .card { position: relative; overflow: hidden; }
  .cell::after { content: ''; position: absolute; left: 0; top: 0; width: 2px; height: 0; background: var(--page-acc); transition: height .5s ease; }
  .cell:hover::after { height: 100%; }

  @media (max-width: 980px) { .hero { grid-template-columns: 1fr; } .demo { min-height: 430px; } }
  @media (max-width: 560px) { .bar-row { grid-template-columns: 1fr 80px; } .bar-row .track { grid-column: 1 / -1; grid-row: 2; } .crit-row { grid-template-columns: 1fr 70px 30px; } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
    .js [data-r] { opacity: 1; transform: none; }
  }
`;

function render(page, lang) {
  const t = page[lang], ui = UI[lang], other = lang === 'en' ? 'ru' : 'en';
  const self = urlOf(lang, page.slug);
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': self, url: self, name: t.title, description: t.desc, inLanguage: lang,
        isPartOf: { '@type': 'WebSite', name: 'QODEQ', url: SITE + '/' },
        publisher: { '@type': 'Organization', name: 'QODEQ', url: SITE + '/', logo: SITE + '/assets/brand/logo-main.png' } },
      { '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };
  const related = PAGES.filter(p => p.slug !== page.slug);
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
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.desc)}" />
<link rel="canonical" href="${self}" />
<link rel="alternate" hreflang="en" href="${urlOf('en', page.slug)}" />
<link rel="alternate" hreflang="ru" href="${urlOf('ru', page.slug)}" />
<link rel="alternate" hreflang="x-default" href="${urlOf('en', page.slug)}" />
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="icon" href="/assets/brand/favicon-16.png" sizes="16x16" type="image/png" />
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${self}" />
<meta property="og:title" content="${esc(t.title)}" />
<meta property="og:description" content="${esc(t.desc)}" />
<meta property="og:image" content="${SITE}/assets/brand/og-image.png?v=2" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${SITE}/assets/brand/og-image.png?v=2" />
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>${CSS}</style>
</head>
<body style="--page-acc: ${page.acc};">

<header class="hdr">
  <a href="${ui.home}" aria-label="QODEQ"><img src="/assets/brand/logo-compact.png?v=2" alt="QODEQ" /></a>
  <nav class="nav">
${ui.nav.map(([h, l, c]) => `    <a href="${h}" style="border-left: 2px solid ${c}; --btn-acc: ${c};">${esc(l)}</a>`).join('\n')}
  </nav>
  <div class="lang">
    <a href="${pathOf('en', page.slug)}" hreflang="en"${lang === 'en' ? ' aria-current="page"' : ''}>EN</a>
    <a href="${pathOf('ru', page.slug)}" hreflang="ru"${lang === 'ru' ? ' aria-current="page"' : ''}>RU</a>
  </div>
</header>

<main>
  <section class="hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div>
      <p class="kicker">${esc(t.kicker)}</p>
      <h1>${esc(t.h1)}</h1>
      <p class="lead">${esc(t.lead)}</p>
      <div class="ctas">
        <a class="btn primary" href="#contact">${esc(ui.ctaPrimary)}</a>
        <a class="btn" href="${ui.home}">${esc(ui.ctaSecondary)}</a>
      </div>
    </div>
    <div class="demo" data-demo data-r style="--d: .15s;" aria-label="${esc(DEMOS[page.slug][lang].note)}"></div>
    <div class="stats" data-r>
${t.stats.map(([v, l]) => `      <div class="stat"><b data-count>${esc(v)}</b><span>${esc(l)}</span></div>`).join('\n')}
    </div>
  </section>

  <section>
    <p class="kicker" data-r>${esc(t.probKicker)}</p>
    <h2 data-r>${esc(t.probTitle)}</h2>
    <div class="grid">
${t.problems.map(([h, p], i) => `      <div class="cell" data-r style="--d: ${(i % 3) * 0.08 + Math.floor(i / 3) * 0.06}s;"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('\n')}
    </div>
  </section>

  <section>
    <p class="kicker" data-r>${esc(ui.howKicker)}</p>
    <h2 data-r>${esc(t.howTitle)}</h2>
    <div class="cards">
${t.how.map(([k, n, p], i) => `      <a class="card" data-r href="${prodHref(lang, k)}" style="--card-acc: ${PROD_ACC[k]}; --d: ${i * 0.08}s;"><h3>${esc(n)}</h3><p>${esc(p)}</p><span class="more">${esc(ui.more)}</span></a>`).join('\n')}
    </div>
  </section>

  <section>
    <p class="kicker" data-r>${esc(ui.econKicker)}</p>
    <h2 data-r>${esc(t.econTitle)}</h2>
    <div class="econ" data-r>
      <table>
${t.econ.map(([l, v]) => `        <tr><td>${esc(l)}</td><td>${esc(v)}</td></tr>`).join('\n')}
      </table>
      <div class="tot">
${t.econTotal.map(([l, v]) => `        <div><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('\n')}
      </div>
    </div>
    <div class="bars" data-r aria-hidden="true">
${BARS[page.slug][lang].map(([l, w, v], i, a) => `      <div class="bar-row${i === a.length - 1 || page.slug === 'customer-support-quality-assurance' ? ' hl' : ''}"><span>${esc(l)}</span><div class="track"><i style="--w: ${w}%;"></i></div><b>${esc(v)}</b></div>`).join('\n')}
    </div>
    <p class="note" data-r>${esc(t.econNote)}</p>
  </section>

  <section>
    <p class="kicker" data-r>${esc(ui.stepsKicker)}</p>
    <h2 data-r>${esc(t.stepsTitle)}</h2>
    <div class="steps" data-r>
${t.steps.map(([w, h, p]) => `      <div class="step"><i>${esc(w)}</i><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('\n')}
    </div>
  </section>

  <section>
    <p class="kicker" data-r>${esc(ui.faqKicker)}</p>
    <h2 data-r>${esc(ui.faqTitle)}</h2>
    <div class="faq">
${t.faq.map(([q, a], i) => `      <details data-r style="--d: ${i * 0.05}s;"${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </div>
  </section>

  <section id="contact">
    <p class="kicker" data-r>${esc(ui.formKicker)}</p>
    <div class="contact" data-r>
      <div>
        <h2 style="margin-bottom: 18px;">${esc(t.ctaTitle)}</h2>
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
  </section>

  <section>
    <p class="kicker">${esc(ui.relatedKicker)}</p>
    <div class="related">
${related.map(p => `      <a class="btn" href="${pathOf(lang, p.slug)}">${esc(p[lang].nav)} →</a>`).join('\n')}
    </div>
  </section>
</main>

<footer>
  <div class="col">
    <span>${esc(ui.footProducts)}</span>
${ui.products.map(([h, l]) => `    <a href="${h}">${esc(l)}</a>`).join('\n')}
  </div>
  <div class="col">
    <span>${esc(ui.footSolutions)}</span>
${PAGES.map(p => `    <a href="${pathOf(lang, p.slug)}">${esc(p[lang].nav)}</a>`).join('\n')}
  </div>
  <div class="col">
    <span>${esc(ui.footResources)}</span>
${ui.resources.map(([h, l]) => `    <a href="${h}">${esc(l)}</a>`).join('\n')}
  </div>
  <div class="col">
    <span>Telegram</span>
    <a href="https://t.me/qodeq">@qodeq</a>
  </div>
  <a class="back" href="${ui.home}">${esc(ui.footBack)}</a>
</footer>

<script>
// ---------- анимации: появление, счётчики, живое демо ----------
(function () {
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEMO = ${JSON.stringify(Object.assign({ type: DEMOS[page.slug].type }, DEMOS[page.slug][lang]))};

  // счётчик: "65%" → 0…65%, "97,6%" и "7 sec" тоже; нечисловые ("24/7") не трогаем
  function countUp(el) {
    var txt = el.textContent, m = txt.match(/^(\\d+)([.,]\\d+)?(.*)$/);
    if (!m || txt.indexOf('/') > -1) return;
    var target = parseFloat(m[1] + (m[2] ? '.' + m[2].slice(1) : '')), dec = m[2] ? m[2].length - 1 : 0, sep = m[2] ? m[2][0] : '', rest = m[3], t0 = null;
    function fmt(v) { var s = v.toFixed(dec); return (sep ? s.replace('.', sep) : s) + rest; }
    function step(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(target * e); if (p < 1) requestAnimationFrame(step); else el.textContent = txt; }
    el.textContent = fmt(0); requestAnimationFrame(step);
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      if (!REDUCED) [].forEach.call(e.target.querySelectorAll('[data-count]'), countUp);
    });
  }, { threshold: .18, rootMargin: '0px 0px -40px 0px' }) : null;
  [].forEach.call(document.querySelectorAll('[data-r]'), function (el) { io ? io.observe(el) : el.classList.add('in'); });

  // ---------- демо ----------
  var box = document.querySelector('[data-demo]'); if (!box) return;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var run = 0;
  function wait(ms, id) { return new Promise(function (res, rej) { setTimeout(function () { id === run ? res() : rej('stop'); }, REDUCED ? 0 : ms); }); }

  box.appendChild(h('div', 'demo-hd', '<span>' + esc(DEMO.title) + '</span><span class="live"><i></i>' + esc(DEMO.online || DEMO.live) + '</span>'));
  var body = box.appendChild(h('div', 'demo-body'));
  var ft = box.appendChild(h('div', 'demo-ft'));

  if (DEMO.type === 'chat') {
    var tabs = h('div', 'tabs'); ft.appendChild(tabs); ft.appendChild(h('span', '', esc(DEMO.note)));
    DEMO.scenarios.forEach(function (s, i) {
      var b = h('button', '', esc(s.tab)); b.type = 'button';
      b.addEventListener('click', function () { play(i); }); tabs.appendChild(b);
    });
    function play(i) {
      var id = ++run, s = DEMO.scenarios[i];
      [].forEach.call(tabs.children, function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      body.innerHTML = '';
      var q = h('div', 'msg-row', '<small>' + esc(DEMO.player) + '</small><div class="bubble">' + esc(s.q) + '</div>'); body.appendChild(q);
      var typing, chips, ans, bub;
      wait(700, id).then(function () { typing = h('div', 'msg-row ai', '<small>' + esc(DEMO.agent) + '</small><div class="bubble typing"><i></i><i></i><i></i></div>'); body.appendChild(typing); return wait(900, id); })
      .then(function () { chips = h('div', 'chips'); body.insertBefore(chips, typing); var p = Promise.resolve();
        s.chips.forEach(function (c) { p = p.then(function () { chips.appendChild(h('span', 'chip', '<b>✓</b>' + esc(c))); return wait(420, id); }); }); return p; })
      .then(function () { body.removeChild(typing); ans = h('div', 'msg-row ai', '<small>' + esc(DEMO.agent) + '</small>'); bub = h('div', 'bubble'); ans.appendChild(bub); body.appendChild(ans);
        var n = 0, txt = s.a; return new Promise(function (res, rej) { (function tick() { if (id !== run) return rej('stop'); n = REDUCED ? txt.length : n + 2; bub.innerHTML = esc(txt.slice(0, n)) + (n < txt.length ? '<span class="caret"></span>' : ''); n < txt.length ? setTimeout(tick, 18) : res(); })(); }); })
      .then(function () { body.appendChild(h('div', 'meta', esc(s.meta))); if (REDUCED) throw 'stop'; return wait(4200, id); })
      .then(function () { body.classList.add('fade-out'); return wait(450, id); })
      .then(function () { body.classList.remove('fade-out'); play((i + 1) % DEMO.scenarios.length); })
      .catch(function () { body.classList.remove('fade-out'); });
    }
    startWhenVisible(function () { play(0); });
  } else {
    ft.appendChild(h('span', '', esc(DEMO.checked))); ft.appendChild(h('span', '', esc(DEMO.note)));
    function playQa() {
      var id = ++run; body.innerHTML = '';
      var lines = h('div', 'qa-lines'), crit = h('div', 'crit'), sc = h('div', 'qa-score', '<span>' + esc(DEMO.score) + '</span><b>0</b>');
      body.appendChild(lines); body.appendChild(crit); body.appendChild(sc);
      var p = Promise.resolve(), els = [];
      DEMO.lines.forEach(function (l) { p = p.then(function () { var e = h('div', 'qa-line', '<small>' + esc(l[0]) + '</small><span>' + esc(l[1]) + '</span>'); lines.appendChild(e); els.push(e); return wait(550, id); }); });
      p.then(function () {
        var bars = DEMO.criteria.map(function (c) { var r = h('div', 'crit-row' + (c[2] ? ' bad' : ''), '<span>' + esc(c[0]) + '</span><span class="track"><i></i></span><b>' + c[1] + '</b>'); crit.appendChild(r); return r; });
        return wait(60, id).then(function () { var q = Promise.resolve();
          bars.forEach(function (r, k) { q = q.then(function () { r.querySelector('i').style.width = DEMO.criteria[k][1] + '%'; return wait(320, id); }); }); return q.then(function () { return wait(900, id); }); });
      }).then(function () {
        var bad = DEMO.criteria.filter(function (c) { return c[2]; })[0];
        if (bad) { els[els.length - 1].classList.add('flag'); crit.appendChild(h('div', 'flag-note', '⚑ ' + esc(bad[2]))); }
        var b = sc.querySelector('b'), t0 = null; return new Promise(function (res) { (function f(ts) { if (!t0) t0 = ts; var k = Math.min((ts - t0) / 900, 1); b.textContent = Math.round(DEMO.total * k); k < 1 && !REDUCED ? requestAnimationFrame(f) : (b.textContent = DEMO.total, res()); })(performance.now()); });
      }).then(function () { if (REDUCED) throw 'stop'; return wait(5200, id); })
        .then(function () { body.classList.add('fade-out'); return wait(450, id); })
        .then(function () { body.classList.remove('fade-out'); playQa(); })
        .catch(function () { body.classList.remove('fade-out'); });
    }
    startWhenVisible(playQa);
  }
  function startWhenVisible(fn) {
    if (!io) return fn();
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold: .3 });
    o.observe(box);
  }
})();

(function () {
  var f = document.querySelector('[data-lead]'), msg = f.querySelector('[data-msg]'), busy = false;
  var T = ${JSON.stringify({ sending: ui.sending, sent: ui.sent, need: ui.need, fail: ui.fail })};
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var name = f.name.value.trim(), company = f.company.value.trim(), contact = f.contact.value.trim();
    if (f.hp.value) { msg.className = 'msg ok'; msg.textContent = T.sent; return; }
    if (!name || !contact) { msg.className = 'msg err'; msg.textContent = T.need; return; }
    busy = true; msg.className = 'msg'; msg.textContent = T.sending;
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, company: company, contact: contact, hp: f.hp.value, lang: '${lang}', page: location.href, product: ${JSON.stringify(page.product)} })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      msg.className = 'msg ok'; msg.textContent = T.sent; f.reset();
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { method: 'solutions_${page.slug.replace(/-/g, '_')}' });
    }).catch(function () { msg.className = 'msg err'; msg.textContent = T.fail; })
      .then(function () { busy = false; });
  });
})();
</script>
</body>
</html>
`;
}

for (const page of PAGES) {
  for (const lang of ['en', 'ru']) {
    const out = path.join(__dirname, UI[lang].prefix.replace(/^\//, ''), 'solutions', page.slug + '.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, render(page, lang), 'utf8');
    console.log('wrote', path.relative(__dirname, out));
  }
}
