// Privacy Policy для /privacy и /ru/privacy. Шаблон — renderLegal() в build_blog.js.
// Текст описывает то, что сайт реально собирает: форма заявки (/api/lead → SQLite leads.db,
// письмо через Gmail SMTP, уведомление в Telegram-группу, автоответ), IP/UA для антиспама,
// UTM/реферер, проверка email через ZeroBounce, Google Analytics 4, Cloudflare. При изменении сбора данных — обновить здесь.
// ЧЕРНОВИК (22.10.2026): юрлицо и адрес оператора данных не указаны, перед финальной
// публикацией текст должен проверить юрист.
module.exports = {
  slug: 'privacy',
  updated: '2026-10-22',
  en: {
    title: 'Privacy Policy — QODEQ',
    desc: 'How QODEQ collects, uses and protects personal data of visitors to qodeq.net and people who contact us.',
    nav: 'Privacy Policy',
    kicker: '— LEGAL',
    h1: 'Privacy Policy',
    lead: 'This policy explains what personal data we collect when you visit qodeq.net or contact us, why we collect it, who we share it with and how you can exercise your rights.',
    body: [
      { h2: '1. Who we are', id: 'who' },
      { p: 'The website qodeq.net is operated by QODEQ (“QODEQ”, “we”, “us”). QODEQ provides an AI support platform for iGaming operators. For this website we are the controller of your personal data.' },
      { p: 'For any privacy question or request, write to {{mail}} or message us on Telegram at [@qodeq](https://t.me/qodeq).' },
      { p: 'This policy covers the website only. Data that our clients process through the QODEQ platform (for example, conversations with their players) is processed on the client’s behalf under a separate data processing agreement.' },

      { h2: '2. What data we collect', id: 'data' },
      { h3: 'Data you give us' },
      { p: 'When you send a request through a form on the site (a calculation request, a meeting request or the business case on /calculator), we receive:' },
      { ul: [
        'your name;',
        'your company name, if you enter it;',
        'your email address, Telegram username or phone number;',
        'the product you are interested in and the language of the page;',
        'the figures you entered in a calculator, if you send them with your request.',
      ] },
      { p: 'If you write to us by email or Telegram, we receive the content of your message and your contact details.' },
      { h3: 'Data collected automatically' },
      { ul: [
        '**Technical data sent with a request:** IP address, browser and device type (user agent), the page you sent the request from, and the date and time.',
        '**Traffic source:** UTM parameters and ad click IDs (gclid, fbclid, yclid) from the link you followed, the referring website and the first page you visited — so we know which channels bring requests. This is kept in your browser’s local storage (key qodeq_attrib_v1) for your first and most recent visit, and sent to us only together with a request.',
        '**Analytics:** pages viewed, time on site, approximate location derived from your IP address, device and browser type, collected by Google Analytics 4 through cookies.',
        '**Security and delivery:** our CDN provider Cloudflare processes your IP address and request data to deliver the site and protect it from attacks.',
      ] },
      { p: 'We do not ask for and do not want sensitive data (health, political views, payment card details and the like). Please do not send it through our forms.' },

      { h2: '3. Why we use your data', id: 'purposes' },
      { table: [
        ['Purpose', 'Data', 'Legal basis (GDPR)'],
        ['Reply to your request, prepare a calculation or proposal, arrange a meeting', 'Form data, messages', 'Steps at your request before entering into a contract; our legitimate interest in answering business enquiries'],
        ['Follow up on your request and keep a record of our communication', 'Form data, messages', 'Legitimate interest in managing business relationships'],
        ['Protect the forms from spam and abuse', 'IP address, user agent', 'Legitimate interest in the security of the site'],
        ['Understand which channels and pages work, improve the site', 'Traffic source, analytics data', 'Legitimate interest; consent where required by law for cookies'],
        ['Comply with legal obligations', 'Any of the above, as required', 'Legal obligation'],
      ] },
      { p: 'We do not sell your personal data and do not use it for automated decision-making that has legal or similarly significant effects on you.' },

      { h2: '4. Cookies and analytics', id: 'cookies' },
      { p: 'The site uses Google Analytics 4 (Google Ireland Ltd / Google LLC). It sets cookies such as _ga and _ga_* to tell visits apart; they are kept for up to 2 years. We use analytics only in aggregated form to understand how the site is used.' },
      { p: 'You can block or delete cookies in your browser settings, or install the [Google Analytics opt-out add-on](https://tools.google.com/dlpage/gaoptout). The site works without analytics cookies.' },

      { h2: '5. Who receives your data', id: 'recipients' },
      { p: 'Your data is available to the QODEQ team members who handle requests. We also use service providers that process data on our behalf:' },
      { ul: [
        '**Cloud hosting provider** — stores the website and the database of requests;',
        '**Cloudflare** — content delivery and protection of the site;',
        '**Google** — email delivery (Google Workspace / Gmail) and website analytics (Google Analytics);',
        '**Telegram** — internal notifications about new requests to our sales team;',
        '**ZeroBounce** — checking that the email address you enter in the form exists (only the address itself is sent).',
      ] },
      { p: 'We may disclose data if required by law or to protect our rights, and to a successor in the event of a merger or acquisition, subject to this policy.' },

      { h2: '6. International transfers', id: 'transfers' },
      { p: 'Our providers may process data outside your country, including outside the European Economic Area. Where this happens, we rely on safeguards required by law, such as the European Commission’s Standard Contractual Clauses or an adequacy decision.' },

      { h2: '7. How long we keep data', id: 'retention' },
      { ul: [
        '**Requests and correspondence** — for as long as needed to handle your request and our business relationship, and no longer than 24 months after our last contact, unless the law requires longer.',
        '**Technical data used for spam protection** — kept with the request it belongs to; rate-limiting data is held in memory for minutes.',
        '**Analytics data** — up to 14 months in Google Analytics; cookies up to 2 years.',
      ] },

      { h2: '8. Your rights', id: 'rights' },
      { p: 'Depending on the law that applies to you (including the GDPR), you have the right to:' },
      { ul: [
        'access the personal data we hold about you and get a copy;',
        'ask us to correct inaccurate data;',
        'ask us to delete your data;',
        'restrict or object to processing, including processing based on legitimate interests;',
        'receive your data in a portable format;',
        'withdraw consent at any time, where processing is based on consent;',
        'lodge a complaint with your data protection authority.',
      ] },
      { p: 'To exercise a right, write to {{mail}}. We reply within one month. We may ask you to confirm your identity before acting on a request.' },

      { h2: '9. Security', id: 'security' },
      { p: 'The site is served only over HTTPS. Access to the database of requests is limited to the people who need it, and our servers and accounts are protected with access controls. No system is completely secure, so please contact us right away if you believe your data has been compromised.' },

      { h2: '10. Children', id: 'children' },
      { p: 'Our services are intended for businesses. The site is not directed at people under 18, and we do not knowingly collect their data.' },

      { h2: '11. Changes to this policy', id: 'changes' },
      { p: 'We may update this policy when our services or the law change. The date of the latest version is shown at the top of this page.' },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности — QODEQ',
    desc: 'Как QODEQ собирает, использует и защищает персональные данные посетителей qodeq.net и тех, кто обращается к нам.',
    nav: 'Политика конфиденциальности',
    kicker: '— ПРАВОВАЯ ИНФОРМАЦИЯ',
    h1: 'Политика конфиденциальности',
    lead: 'Здесь описано, какие персональные данные мы получаем, когда вы заходите на qodeq.net или пишете нам, зачем они нужны, кому мы их передаём и как вы можете воспользоваться своими правами.',
    body: [
      { h2: '1. Кто мы', id: 'who' },
      { p: 'Сайтом qodeq.net управляет QODEQ («QODEQ», «мы»). QODEQ — AI-платформа поддержки для iGaming-операторов. В отношении данных, собираемых на этом сайте, мы выступаем оператором (контролёром) персональных данных.' },
      { p: 'По любым вопросам о персональных данных пишите на {{mail}} или в Telegram [@qodeq](https://t.me/qodeq).' },
      { p: 'Политика касается только сайта. Данные, которые наши клиенты обрабатывают на платформе QODEQ (например, переписку со своими игроками), обрабатываются по поручению клиента на основании отдельного соглашения об обработке данных.' },

      { h2: '2. Какие данные мы собираем', id: 'data' },
      { h3: 'Данные, которые вы передаёте сами' },
      { p: 'Когда вы отправляете заявку через форму на сайте (запрос расчёта, запись на встречу или бизнес-кейс на /calculator), мы получаем:' },
      { ul: [
        'ваше имя;',
        'название компании, если вы его указали;',
        'email, имя пользователя в Telegram или номер телефона;',
        'интересующий продукт и язык страницы;',
        'цифры, которые вы ввели в калькулятор, если вы отправили их вместе с заявкой.',
      ] },
      { p: 'Если вы пишете нам по email или в Telegram, мы получаем текст сообщения и ваши контактные данные.' },
      { h3: 'Данные, которые собираются автоматически' },
      { ul: [
        '**Технические данные заявки:** IP-адрес, тип браузера и устройства (user agent), страница, с которой отправлена заявка, дата и время.',
        '**Источник перехода:** UTM-метки и идентификаторы рекламных кликов (gclid, fbclid, yclid) из ссылки, по которой вы пришли, сайт-источник и первая страница визита — чтобы понимать, какие каналы приводят заявки. Эти данные о первом и последнем визите хранятся в локальном хранилище вашего браузера (ключ qodeq_attrib_v1) и передаются нам только вместе с заявкой.',
        '**Аналитика:** просмотренные страницы, время на сайте, примерное местоположение по IP-адресу, тип устройства и браузера — их собирает Google Analytics 4 с помощью cookie.',
        '**Безопасность и доставка:** CDN-провайдер Cloudflare обрабатывает ваш IP-адрес и данные запросов, чтобы доставлять сайт и защищать его от атак.',
      ] },
      { p: 'Мы не запрашиваем и не хотим получать чувствительные данные (о здоровье, политических взглядах, данные платёжных карт и т. п.). Пожалуйста, не отправляйте их через формы.' },

      { h2: '3. Зачем мы используем данные', id: 'purposes' },
      { table: [
        ['Цель', 'Данные', 'Правовое основание (GDPR)'],
        ['Ответить на заявку, подготовить расчёт или предложение, договориться о встрече', 'Данные формы, сообщения', 'Действия по вашему запросу до заключения договора; наш законный интерес отвечать на деловые обращения'],
        ['Продолжить общение по заявке и хранить историю переписки', 'Данные формы, сообщения', 'Законный интерес в ведении деловых отношений'],
        ['Защитить формы от спама и злоупотреблений', 'IP-адрес, user agent', 'Законный интерес в безопасности сайта'],
        ['Понимать, какие каналы и страницы работают, улучшать сайт', 'Источник перехода, данные аналитики', 'Законный интерес; согласие, если его требует закон для cookie'],
        ['Выполнить требования закона', 'Любые из перечисленных, в необходимом объёме', 'Юридическая обязанность'],
      ] },
      { p: 'Мы не продаём персональные данные и не принимаем на их основе автоматизированных решений, которые влекут для вас юридические или иные существенные последствия.' },

      { h2: '4. Cookie и аналитика', id: 'cookies' },
      { p: 'На сайте работает Google Analytics 4 (Google Ireland Ltd / Google LLC). Он устанавливает cookie _ga и _ga_*, чтобы различать визиты; они хранятся до 2 лет. Аналитику мы используем только в обобщённом виде, чтобы понимать, как используется сайт.' },
      { p: 'Cookie можно заблокировать или удалить в настройках браузера либо установить [надстройку для отключения Google Analytics](https://tools.google.com/dlpage/gaoptout). Сайт работает и без аналитических cookie.' },

      { h2: '5. Кому мы передаём данные', id: 'recipients' },
      { p: 'Доступ к данным есть у сотрудников QODEQ, которые обрабатывают заявки. Кроме того, данные по нашему поручению обрабатывают поставщики услуг:' },
      { ul: [
        '**облачный хостинг-провайдер** — хранит сайт и базу заявок;',
        '**Cloudflare** — доставка контента и защита сайта;',
        '**Google** — доставка email (Google Workspace / Gmail) и веб-аналитика (Google Analytics);',
        '**Telegram** — внутренние уведомления отделу продаж о новых заявках;',
        '**ZeroBounce** — проверка, что указанный в форме email существует (передаётся только сам адрес).',
      ] },
      { p: 'Мы можем раскрыть данные, если этого требует закон или это нужно для защиты наших прав, а также правопреемнику при реорганизации или продаже бизнеса — на условиях этой политики.' },

      { h2: '6. Трансграничная передача', id: 'transfers' },
      { p: 'Наши поставщики могут обрабатывать данные за пределами вашей страны, в том числе за пределами Европейской экономической зоны. В таких случаях мы опираемся на предусмотренные законом гарантии — например, стандартные договорные условия Европейской комиссии или решение о достаточном уровне защиты.' },

      { h2: '7. Сколько мы храним данные', id: 'retention' },
      { ul: [
        '**Заявки и переписка** — столько, сколько нужно для обработки заявки и ведения деловых отношений, но не дольше 24 месяцев после последнего контакта, если закон не требует хранить дольше.',
        '**Технические данные для защиты от спама** — хранятся вместе с заявкой; данные для ограничения частоты запросов держатся в памяти несколько минут.',
        '**Данные аналитики** — до 14 месяцев в Google Analytics; cookie — до 2 лет.',
      ] },

      { h2: '8. Ваши права', id: 'rights' },
      { p: 'В зависимости от применимого к вам законодательства (в том числе GDPR) вы вправе:' },
      { ul: [
        'узнать, какие ваши данные у нас есть, и получить их копию;',
        'потребовать исправить неточные данные;',
        'потребовать удалить ваши данные;',
        'ограничить обработку или возразить против неё, в том числе против обработки на основании законного интереса;',
        'получить свои данные в переносимом формате;',
        'в любой момент отозвать согласие, если обработка основана на согласии;',
        'подать жалобу в орган по защите персональных данных.',
      ] },
      { p: 'Чтобы воспользоваться правом, напишите на {{mail}}. Мы отвечаем в течение месяца и можем попросить подтвердить вашу личность, прежде чем выполнить запрос.' },

      { h2: '9. Безопасность', id: 'security' },
      { p: 'Сайт работает только по HTTPS. Доступ к базе заявок есть только у тех, кому он нужен для работы, серверы и учётные записи защищены средствами контроля доступа. Полностью защищённых систем не бывает, поэтому, если вы считаете, что ваши данные скомпрометированы, сразу сообщите нам.' },

      { h2: '10. Дети', id: 'children' },
      { p: 'Наши услуги предназначены для бизнеса. Сайт не ориентирован на лиц младше 18 лет, и мы сознательно не собираем их данные.' },

      { h2: '11. Изменения политики', id: 'changes' },
      { p: 'Мы можем обновлять политику при изменении наших сервисов или законодательства. Дата актуальной версии указана в начале страницы.' },
    ],
  },
};
