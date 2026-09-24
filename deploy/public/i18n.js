// Internal navigation: carry the current query string onto every relative internal
// link, and make sure links break out of any embedding iframe.
(function () {
  var fix = function () {
    var qs = location.search || '';
    document.querySelectorAll('a[href^="/"]').forEach(function (a) {
      var raw = a.getAttribute('href');
      if (!raw || /^(https?:|mailto:|tel:)/i.test(raw) || raw.indexOf('?') > -1) return;
      var hash = '', base = raw;
      var i = raw.indexOf('#');
      if (i > -1) { base = raw.slice(0, i); hash = raw.slice(i); }
      a.setAttribute('href', base + qs + hash);
      a.target = '_top';
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fix);
  else fix();
  window.addEventListener('load', fix);
  setTimeout(fix, 600);
  setTimeout(fix, 2000);
})();

// Mailto links: assembled from data-mail-user/data-mail-host at runtime instead of being
// written as a plain "user@host" string in the HTML. Cloudflare's Email Address
// Obfuscation (Scrape Shield) rewrites any literal email/mailto it finds in the raw
// response into a "[email protected]" placeholder that only decodes back via Cloudflare's
// own injected script — which real users' ad-blockers routinely block. Building the
// address here means there's no literal email substring in the HTML for it to catch.
//
// mailto: only does something visible if the visitor's OS has a default mail app
// registered; without one, the click is a silent no-op (some browsers/setups instead
// just re-focus the current page, which reads as "it did nothing / reset the page").
// So on click we ALSO copy the address to the clipboard and show a toast — that always
// gives visible feedback, and doesn't stop the native mailto: from opening too when a
// mail client is configured. Wrapped defensively so it can never break the click.
(function () {
  var toastEl = null, toastTimer = null;
  var ru = (navigator.language || '').toLowerCase().indexOf('ru') === 0;
  function showToast(email) {
    try {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.style.cssText = 'position:fixed;left:50%;bottom:26px;z-index:99999;padding:12px 20px;background:#151512;border:1px solid rgba(255,255,255,.16);color:#F5F2EC;font:400 12px/1 "JetBrains Mono",monospace;letter-spacing:.04em;opacity:0;transform:translate(-50%,10px);transition:opacity .25s ease,transform .25s ease;pointer-events:none;';
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = (ru ? 'Адрес скопирован: ' : 'Address copied: ') + email;
      toastEl.style.opacity = '1';
      toastEl.style.transform = 'translate(-50%,0)';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translate(-50%,10px)';
      }, 2400);
    } catch (e) {}
  }
  var fill = function () {
    document.querySelectorAll('a[data-mail-user][data-mail-host]').forEach(function (a) {
      var email = a.getAttribute('data-mail-user') + '@' + a.getAttribute('data-mail-host');
      var subject = a.getAttribute('data-mail-subject');
      a.setAttribute('href', 'mailto:' + email + (subject ? '?subject=' + encodeURIComponent(subject) : ''));
      if (a.hasAttribute('data-mail-fill')) a.textContent = email;
      if (!a.dataset.mailWired) {
        a.dataset.mailWired = '1';
        a.addEventListener('click', function () {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email).catch(function () {});
          } catch (e) {}
          showToast(email);
        });
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
  else fill();
  window.addEventListener('load', fill);
  setTimeout(fill, 600);
  setTimeout(fill, 2000);
})();

// SBC Summit Lisbon announcement bar + homepage section: close button for the bar
// (remembered via localStorage so it stays dismissed on later visits/pages), and a
// document-wide EN/RU text swap for every [data-text-en] element (the bar and the
// "See the full QODEQ lineup" section). Wired here rather than through each page's app
// class so it works the same everywhere, independent of each page's own (sometimes
// incomplete) i18n plumbing.
(function () {
  var wire = function () {
    var bar = document.getElementById('qodeq-promo-bar');
    if (bar && !bar.dataset.promoWired) {
      bar.dataset.promoWired = '1';
      var closeBtn = bar.querySelector('[data-promo-close]');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          bar.style.display = 'none';
          document.documentElement.style.setProperty('--promo-h', '0px');
          try { localStorage.setItem('qodeq_promo_lisbon', '1'); } catch (e) {}
        });
      }
    }
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      if (btn.dataset.textSwapWired) return;
      btn.dataset.textSwapWired = '1';
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-lang');
        document.querySelectorAll('[data-text-en]').forEach(function (el) {
          el.textContent = lang === 'ru' ? el.getAttribute('data-text-ru') : el.getAttribute('data-text-en');
        });
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();

// SBC Summit Lisbon countdown badge: "N DAYS TO GO" -> "WE'RE LIVE" during the event ->
// hides itself once it's over. Updates the element's data-text-en/ru too, so a later
// language toggle (handled by the block above) shows the correct dynamic value instead
// of stale placeholder text.
(function () {
  var run = function () {
    var el = document.querySelector('[data-lisbon-countdown]');
    if (!el) return;
    var start = new Date('2026-09-29T00:00:00');
    var end = new Date('2026-10-02T00:00:00');
    var now = new Date();
    var enText, ruText;
    if (now < start) {
      var days = Math.ceil((start - now) / 86400000);
      if (days <= 1) { enText = 'TOMORROW'; ruText = 'ЗАВТРА'; }
      else { enText = days + ' DAYS TO GO'; ruText = days + ' ДН. ДО НАЧАЛА'; }
    } else if (now < end) {
      enText = "WE'RE LIVE — COME SAY HI"; ruText = 'МЫ ЗДЕСЬ — ЗАХОДИТЕ';
    } else {
      var wrap = el.parentElement;
      if (wrap) wrap.style.display = 'none';
      return;
    }
    el.setAttribute('data-text-en', enText);
    el.setAttribute('data-text-ru', ruText);
    el.textContent = enText;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// Live chat: сообщения идут через наш же бэкенд (server/.../api/livechat/*), который
// проксирует внутренний API инбокса Chatwoot — так весь диалог рендерится нашей
// собственной вёрсткой (те же bubble()-пузыри, что и в AI-демо), без чужого iframe.
window.QODEQ_LIVECHAT = (function () {
  // Один объект сессии на key (qchat/pchat), создаётся один раз и больше никогда не
  // пересоздаётся целиком — только очищается на месте (см. reset). Так таймер и seen
  // всегда принадлежат одному и тому же объекту, без риска завести вторую параллельную
  // сессию с собственным таймером (что и было источником дублей).
  var sessions = {};

  // Токен живёт только в памяти этой загрузки страницы (не в localStorage) и отдельно
  // на каждый key (qchat — главная, pchat — /chat): так у каждой страницы свой диалог
  // в Chatwoot, и обычный переход между страницами (полная перезагрузка) сам по себе
  // начинает разговор заново — не нужно ничего чистить руками при заходе.
  var tokens = {};
  function getToken(key) { return tokens[key] || ''; }
  function setToken(key, t) { tokens[key] = t; }
  function clearToken(key) { delete tokens[key]; }

  var initPromises = {};
  function init(key) {
    var t = getToken(key);
    if (t) return Promise.resolve(t);
    if (initPromises[key]) return initPromises[key];
    initPromises[key] = fetch('/api/livechat/init?surface=' + encodeURIComponent(key)).then(function (r) { return r.json(); }).then(function (d) {
      initPromises[key] = null;
      if (!d.ok) throw new Error('init failed');
      setToken(key, d.token);
      return d.token;
    }).catch(function (err) { initPromises[key] = null; throw err; });
    return initPromises[key];
  }

  function session(key) {
    if (!sessions[key]) sessions[key] = { key: key, seen: {}, timer: null, typing: false, onMessage: null, onTyping: null, intervalMs: 4000 };
    return sessions[key];
  }

  // Автоответ бота часто прилетает почти мгновенно — без минимальной задержки точки
  // «···» включались и гасли быстрее одного кадра анимации и были не видны глазу.
  var MIN_TYPING_MS = 800;

  function setTyping(s, active) {
    if (s.typing === active) return;
    s.typing = active;
    if (active) s.typingSince = Date.now();
    if (s.onTyping) s.onTyping(active);
  }

  // Дедупликация — строго по id сообщения с сервера. Никакого сопоставления по тексту:
  // своё сообщение тоже рендерится только когда сервер подтвердил его и вернул id
  // (см. send), поэтому у него тоже есть настоящий id и оно проходит тот же seen-фильтр.
  function deliver(s, msg) {
    if (s.seen[msg.id]) return;
    s.seen[msg.id] = true;
    // message_type 3 — служебные шаблонные сообщения самого Chatwoot (например,
    // автоматическое приглашение оставить email при создании диалога). У нас для
    // этого свой баннер в разметке — чужой текст здесь просто мусорит в чате.
    if (msg.message_type === 3) return;
    var isVisitor = !!(msg.sender && msg.sender.type === 'contact');
    if (isVisitor) {
      if (s.onMessage) s.onMessage('p', msg.content);
      return;
    }
    var render = function () {
      setTyping(s, false);
      if (s.onMessage) s.onMessage('a', msg.content);
    };
    if (s.typing) {
      var wait = Math.max(0, MIN_TYPING_MS - (Date.now() - s.typingSince));
      setTimeout(render, wait);
    } else {
      render();
    }
  }

  // Гарантированно ровно один активный таймер на сессию: сначала гасим старый (если
  // был), потом ставим новый. Безопасно звать из любого места сколько угодно раз.
  function ensureTimer(s) {
    if (s.timer) { clearInterval(s.timer); s.timer = null; }
    function tick() {
      var token = getToken(s.key);
      if (!token) return;
      fetch('/api/livechat/messages?surface=' + encodeURIComponent(s.key), { headers: { 'X-Auth-Token': token } })
        .then(function (r) { return r.json(); })
        .then(function (d) { (d.ok ? d.messages : []).forEach(function (m) { deliver(s, m); }); })
        .catch(function () {});
    }
    tick();
    s.timer = setInterval(tick, s.intervalMs);
  }

  function stopTimer(s) {
    if (s.timer) { clearInterval(s.timer); s.timer = null; }
  }

  // Контакт/диалог в Chatwoot создаётся не здесь, а лениво — по факту первого send():
  // иначе каждый заход на блок (в т.ч. авто-прокрутка карусели) плодил бы в инбоксе
  // пустые визиты без единого сообщения. Поэтому poll() запускает таймер, только если
  // токен уже есть (возврат к начатому ранее разговору).
  function poll(key, onMessage, onTyping, intervalMs) {
    var s = session(key);
    s.onMessage = onMessage;
    s.onTyping = onTyping || null;
    s.intervalMs = intervalMs || 4000;
    if (getToken(key)) ensureTimer(s); else stopTimer(s);
  }

  function stop(key) {
    stopTimer(session(key));
  }

  // Своё сообщение рендерится оптимистично — сразу, не дожидаясь ответа сервера.
  // POST на chat-platform.qodeq.net сам по себе может занимать по нескольку
  // секунд (конверсия контакта в диалог, автоматизации Chatwoot), и ждать этого
  // молча до отрисовки бабла выглядело так, будто сообщение зависло.
  // Дедупликация всё так же строго по id: когда сервер подтвердит отправку,
  // настоящий id просто помечается как увиденный — уже показанный бабл не
  // перерисовывается повторно, а последующий поллинг не продублирует его.
  // onMessage/onTyping передаются заново при каждом send() (а не только один раз в
  // poll()): если фреймворк за это время пересобрал компонент и завёл новые замыкания,
  // отправка сообщения всё равно подцепит актуальные, а не осиротевшие колбэки.
  function send(key, onMessage, onTyping, text) {
    var s = session(key);
    s.onMessage = onMessage;
    s.onTyping = onTyping || s.onTyping;
    var pending = s.onMessage ? s.onMessage('p', text) : null;
    init(key).then(function (token) {
      return fetch('/api/livechat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, content: text, surface: key }),
      }).then(function (r) { return r.json(); });
    }).then(function (d) {
      if (d && d.ok && d.message) {
        s.seen[d.message.id] = true;
        setTyping(s, true);
      } else if (pending && pending.style) {
        pending.style.opacity = '.5';
      }
      ensureTimer(s);
    }).catch(function () {
      if (pending && pending.style) pending.style.opacity = '.5';
    });
  }

  function reset(key, onMessage, onTyping) {
    var s = session(key);
    stopTimer(s);
    clearToken(key);
    setTyping(s, false);
    s.seen = {};
    s.onMessage = onMessage;
    s.onTyping = onTyping || null;
  }

  // Как и send(), лениво создаёт контакт/диалог (через init) прямо на этом
  // вызове — то есть только когда посетитель реально ввёл email и нажал
  // отправить, а не просто увидел баннер с приглашением его оставить.
  function setEmail(key, email) {
    var s = session(key);
    return init(key).then(function (token) {
      return fetch('/api/livechat/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, email: email, surface: key }),
      }).then(function (r) { return r.json(); });
    }).then(function (d) {
      ensureTimer(s);
      return !!(d && d.ok);
    }).catch(function () { return false; });
  }

  return { poll: poll, stop: stop, send: send, reset: reset, setEmail: setEmail };
})();

window.QODEQ_I18N = {
  ru: {
    "nav.products": "Продукты",
    "nav.econ": "Экономика",
    "nav.calc": "Калькулятор",
    "nav.process": "Процесс",
    "nav.contact": "Контакты",
    "hero.kicker": "AI-ПЛАТФОРМА · IGAMING · ЧАТ / QA / ПЛАТЕЖИ / ГОЛОС",
    "hero.title": "AI-платформа для",
    "hero.sub": "Снижаем операционные расходы и повышаем удовлетворённость клиентов с помощью продвинутых AI-решений — для казино, букмекеров и лотерей.",
    "hero.s1": "Уровень автоматизации",
    "hero.s2": "Срок до продакшена",
    "hero.s3": "Доступность",
    "hero.s4": "Чатов обработано",
    "hero.scroll": "Листайте — цифры считаются на ходу",
    "prod.kicker": "— ЛИНЕЙКА ПРОДУКТОВ",
    "prod.title": "Пять агентов. Одна платформа.",
    "prod.sub": "Каждый агент работает автономно или как часть платформы — одна база знаний, один контекст CRM, один слой аналитики.",
    "prod.open": "ОТКРЫТЬ",
    "prod.d1": "AI-чатбот для автоматизации поддержки клиентов.",
    "prod.d2": "Автоматический контроль качества чатов — 100% вместо выборки.",
    "prod.d3": "Автоматизация обработки платёжных обращений.",
    "prod.d4": "Автоматический контроль качества звонков.",
    "prod.d5": "AI-голосовой бот для входящих и исходящих звонков.",
    "proc.kicker": "— ПРОЦЕСС · ГОРИЗОНТАЛЬНАЯ ПРОКРУТКА",
    "proc.title": "Как работает AI Chat Operator.",
    "proc.p1": "Клиент задаёт вопрос",
    "proc.p2": "AI анализирует запрос",
    "proc.p3": "Поиск в базе знаний",
    "proc.p4": "Генерация персонального ответа",
    "proc.p5": "Мгновенная доставка клиенту",
    "proc.t1": "Диалог приходит из любого канала — сайт, приложение, мессенджер. Очередь не образуется.",
    "proc.t2": "Контекст CRM, статус KYC и история ставок подтягиваются до первого ответа.",
    "proc.t3": "Правила, бонусы, лимиты, KYC-флоу — доступ без участия разработчиков.",
    "proc.t4": "Сложные сценарии: верификация, вейджер, блокировки. Тон голоса вашего бренда.",
    "proc.t5": "7 секунд на типовое обращение. Тикет создан и обогащён, диалог протегирован.",
    "ui.kicker": "— КОНСОЛЬ ОПЕРАТОРА",
    "ui.title": "Одна консоль за всеми агентами.",
    "ui.sub": "Живой трафик, оценка качества и платёжные конвейеры в одном интерфейсе — те же данные, по которым работает команда и отчитывается финдиректор.",
    "ui.concept": "КОНЦЕПТ ИНТЕРФЕЙСА",
    "ui.n1": "ОБЗОР",
    "ui.n2": "КОНТРОЛЬ КАЧЕСТВА",
    "ui.n3": "ПЛАТЕЖИ",
    "ui.h1": "Обзор операций",
    "ui.h2": "Проверка качества · чат #48,271",
    "ui.h3": "Платёжный конвейер",
    "ui.k1": "ЧАТОВ ЗА СЕГОДНЯ",
    "ui.k2": "АВТОМАТИЗИРОВАНО",
    "ui.k3": "СРЕДНИЙ ОТВЕТ",
    "ui.k4": "РАСХОД ЗА СЕГОДНЯ",
    "ui.c1": "ТРАФИК · 24 ЧАСА",
    "ui.c2": "ЧАСТЫЕ ЗАПРОСЫ",
    "ui.c3": "ОЧЕРЕДЬ ЭСКАЛАЦИЙ · НУЖЕН ЧЕЛОВЕК",
    "ui.score": "ОБЩАЯ ОЦЕНКА",
    "ui.coach": "ЗАМЕТКА ДЛЯ ОБУЧЕНИЯ",
    "ui.note": "КОНЦЕПТ ИНТЕРФЕЙСА · ДАННЫЕ ИЛЛЮСТРАТИВНЫ",
    "calc.curve": "НАКОПЛЕННЫЕ ЗАТРАТЫ · 12 МЕСЯЦЕВ",
    "calc.lgd1": "ТОЛЬКО ЛЮДИ",
    "calc.lgd2": "С QODEQ",
    "scen.t0": "ЗАДЕРЖКА ВЫПЛАТЫ",
    "scen.t1": "ОТЫГРЫШ БОНУСА",
    "scen.t2": "ПОДОЗРЕНИЕ НА ФРОД",
    "scen.m1": "ОТВЕТ",
    "scen.m2": "СЭКОНОМЛЕНО ВРЕМЕНИ ОПЕРАТОРА",
    "scen.m3": "ИСХОД",
    "scen.foot": "ВОСПРОИЗВЕДЕНИЕ РЕАЛЬНОГО ПУТИ РЕШЕНИЯ",
    "chat.kicker": "— ЖИВОЙ ДИАЛОГ",
    "chat.title": "Полное решение вместо переадресации.",
    "chat.c1": "Понимание контекста диалога",
    "chat.c2": "Ответы любой сложности",
    "chat.c3": "Комплексная поддержка",
    "chat.c4": "Ускоренная обработка обращений",
    "chat.c5": "Автоматическое создание тикетов",
    "chat.c6": "Автоматическое тегирование",
    "chat.cd1": "CRM, KYC и история ставок — до первого ответа.",
    "chat.cd2": "Бонусы, вейджер, лимиты, верификация, выплаты.",
    "chat.cd3": "Полное решение вместо переадресации игрока.",
    "chat.cd4": "Время в очереди падает с минут до секунд.",
    "chat.cd5": "Тикет открыт и обогащён без оператора.",
    "chat.cd6": "Каждый диалог классифицирован для аналитики.",
    "econ.kicker": "— ЭКОНОМИЧЕСКАЯ ЭФФЕКТИВНОСТЬ",
    "econ.title": "Стоимость оператора против стоимости агента.",
    "econ.human": "ЖИВОЙ ОПЕРАТОР",
    "econ.ai": "AI CHAT OPERATOR",
    "econ.h1": "Зарплата оператора",
    "econ.h2": "Сервисные расходы",
    "econ.h3": "Прочее: HR, обучение, простои",
    "econ.h4": "Покрытие",
    "econ.h1v": "включено",
    "econ.h4v": "по сменам",
    "econ.a1": "Только техническая поддержка",
    "econ.a2": "Нет дополнительных расходов",
    "econ.a3": "24/7 · неограниченное масштабирование",
    "econ.a4": "Мгновенные обновления по запросу",
    "econ.bars": "Чем больше объём чатов, тем больше экономия",
    "econ.barsub": "Модель: 65% чатов закрывает агент, 35% — операторы по $0.50 за чат.",
    "calc.kicker": "— ИНТЕРАКТИВНЫЙ РАСЧЁТ",
    "calc.title": "Ваша экономика. Двигайте ползунки.",
    "calc.chats": "Чатов в месяц",
    "calc.autom": "Уровень автоматизации",
    "calc.tickets": "Платёжных тикетов в месяц",
    "calc.mins": "Минут голоса в месяц",
    "calc.qa": "AI QA System · проверка 100% чатов",
    "calc.without": "Без AI · только люди",
    "calc.with": "С платформой QODEQ",
    "calc.save": "Экономия в месяц",
    "calc.year": "Экономия в год",
    "calc.roi": "Окупаемость внедрения",
    "calc.plan": "Ваш тарифный план",
    "calc.break": "РАЗБИВКА ПО ПРОДУКТАМ",
    "price.kicker": "— СВОДКА ЦЕН",
    "price.title": "Все продукты. Один прайс.",
    "price.note": "Диапазоны объёмов различаются по продуктам — точные пороги на странице каждого продукта.",
    "time.kicker": "— ВНЕДРЕНИЕ",
    "time.title": "От доступов до экономии — 7 недель.",
    "cta.kicker": "— ГОТОВЫ НАЧАТЬ ЭКОНОМИТЬ?",
    "cta.title": "Сократите расходы на поддержку вдвое.",
    "cta.sub": "ROI за 6–12 месяцев. Оставьте контакт — пришлём персональный расчёт по вашим объёмам.",
    "cta.name": "Имя",
    "cta.company": "Компания",
    "cta.email": "Email или Telegram",
    "cta.send": "ОТПРАВИТЬ ЗАЯВКУ С МОИМ РАСЧЁТОМ",
    "cta.offer": "СПЕЦПРЕДЛОЖЕНИЕ",
    "cta.offerv": "−20% на setup fee до конца месяца",
    "cta.guar": "ГАРАНТИЯ РЕЗУЛЬТАТА",
    "cta.guarv": "Setup fee возвращается, если цели не достигнуты за 6 месяцев",
    "cta.done": "Заявка зафиксирована.",
    "cta.donesub": "Мы свяжемся с вами и приложим расчёт, который вы собрали выше.",

    "show.breakdown": "ПОЛНЫЙ РАЗБОР",
    "show.reset": "СБРОС",
    "show.from": "ОТ",
    "tab.cap": "ВОЗМОЖНОСТИ",
    "tab.price": "ЦЕНЫ",
    "tab.econ": "ВАШИ ЦИФРЫ",
    "tab.time": "СРОКИ",
    "th.plan": "ТАРИФ",

    "show.chat.crumb": "01 / AI CHAT OPERATOR",
    "show.chat.head": "Собственная генеративная модель, а не обёртка над публичным API.",
    "show.chat.desc": "Обучена на реальном трафике поддержки iGaming и напрямую интегрирована в вашу платформу — полное решение чата от начала до конца, на любом языке, в тоне голоса вашего бренда.",
    "show.chat.b1": "Собственная LLM, дообученная на 5 млн чатов поддержки",
    "show.chat.b2": "Сложные сценарии решаются, а не переадресуются",
    "show.chat.b3": "Эскалация к человеку с полным контекстом",
    "show.chat.demolabel": "ЖИВОЕ ДЕМО · СПРОСИТЕ АГЕНТА О ЧЁМ УГОДНО",
    "show.chat.modedemo": "ИИ-ДЕМО",
    "show.chat.modelive": "ЖИВОЙ ЧАТ",
    "show.chat.liveph": "Напишите сообщение…",
    "show.chat.q1": "ВЫВОД",
    "show.chat.q2": "БОНУС",
    "show.chat.q3": "KYC",
    "show.chat.q4": "ЛИМИТЫ",
    "show.chat.stat1": "РЕШЕНО ПОЛНОСТЬЮ",
    "show.chat.stat2": "ВРЕМЯ ОТВЕТА",
    "show.chat.stat3": "ЧАТОВ ЗА ВСЁ ВРЕМЯ",
    "show.chat.perunit": "/ закрытый чат",
    "show.chat.cap1.t": "Быстрый доступ к базе знаний",
    "show.chat.cap1.d": "Правила, бонусы и флоу обновляются без участия разработчиков.",
    "show.chat.cap2.t": "Сложные сценарии",
    "show.chat.cap2.d": "KYC, бонусы, лимиты, блокировки — решаются, а не переадресуются.",
    "show.chat.cap3.t": "Бесшовная интеграция по API",
    "show.chat.cap3.d": "Подключается напрямую к iGaming-платформе и хелпдеску.",
    "show.chat.cap4.t": "Любой язык, ваш тон",
    "show.chat.cap4.d": "Адаптируется под голос бренда казино в каждом регионе.",
    "show.chat.cap5.t": "Масштабирование без потери качества",
    "show.chat.cap5.d": "Тысячи одновременных запросов, без очереди.",
    "show.chat.cap6.t": "В планах · омниканальность",
    "show.chat.cap6.d": "Единая история по чату, голосу и соцсетям; прогноз оттока с удерживающими предложениями.",
    "show.chat.th2": "ЧАТОВ В МЕСЯЦ",
    "show.chat.th3": "ЦЕНА / ЗАКРЫТЫЙ ЧАТ",
    "show.chat.setup.l": "ПЛАТА ЗА ВНЕДРЕНИЕ",
    "show.chat.setup.d": "$1,000 разово для всех тарифов — интеграция, загрузка базы знаний, настройка тона голоса.",
    "show.chat.bill.l": "ЛОГИКА ОПЛАТЫ",
    "show.chat.bill.d": "За закрытый чат — не за сообщение и не за пользователя. Эскалированные чаты не тарифицируются повторно.",
    "show.chat.bench.l": "ОРИЕНТИР",
    "show.chat.bench.d": "Живой оператор в среднем стоит $0,50 за чат — любой тариф оказывается ниже этой планки с первого месяца.",
    "show.chat.econlabel": "ЧАТОВ В МЕСЯЦ",
    "show.chat.time1.t": "Интеграция с платформой",
    "show.chat.time1.d": "Подключение по API к вашей iGaming-платформе и хелпдеску.",
    "show.chat.time2.t": "Загрузка базы знаний",
    "show.chat.time2.d": "Правила, бонусы, флоу KYC, тон голоса.",
    "show.chat.time3.t": "Тестирование сценариев",
    "show.chat.time3.d": "Теневой режим, калибровка по операторам.",
    "show.chat.time4.t": "Запуск в проде",
    "show.chat.time4.d": "Постепенный вывод трафика под живым наблюдением.",

    "show.qachat.crumb": "02 / AI QA SYSTEM",
    "show.qachat.head": "1000 чатов проверено вместо 2.",
    "show.qachat.desc": "AI-анализ каждого чата в реальном времени — 15 критериев, точность 97,6%, ежедневные отчёты по каждому оператору, поднимающие эффективность на 25–40%.",
    "show.qachat.b1": "15 взвешенных критериев, оценка в реальном времени",
    "show.qachat.b2": "Метки времени нарушений в каждом диалоге",
    "show.qachat.b3": "Модуль ручной перепроверки дообучает модель",
    "show.qachat.demolabel": "ВЫБЕРИТЕ РЕАЛЬНЫЙ ЧАТ · ОЦЕНКА ЗА 5 СЕК",
    "show.qachat.s1": "#48 271 ВЫВОД СРЕДСТВ",
    "show.qachat.s2": "#48 302 СПОР О БОНУСЕ",
    "show.qachat.s3": "#48 415 KYC",
    "show.qachat.evdefault": "Нажмите на критерий — модель покажет точную строку, за которую он был оценён.",
    "show.qachat.stat1": "ОХВАТ ЧАТОВ",
    "show.qachat.stat2": "ТОЧНОСТЬ",
    "show.qachat.stat3": "ВРЕМЯ ПРОВЕРКИ",
    "show.qachat.perunit": "/ проверенный чат",
    "show.qachat.cap1.t": "Система фильтрации",
    "show.qachat.cap1.d": "Поиск по 15 параметрам: оператор, смена, наличие эскалаций.",
    "show.qachat.cap2.t": "Детальный анализ чата",
    "show.qachat.cap2.d": "Конкретные нарушения с таймкодами и рекомендациями по улучшению.",
    "show.qachat.cap3.t": "Статистика по операторам",
    "show.qachat.cap3.d": "Ежемесячные отчёты: средний балл, обработанные чаты, топ-3 сильных стороны и зоны роста.",
    "show.qachat.cap4.t": "Модуль ручной перепроверки",
    "show.qachat.cap4.d": "QA-менеджеры анонимно проверяют, корректируют оценки AI и оставляют комментарии для обучения алгоритма.",
    "show.qachat.cap5.t": "Настройка критериев",
    "show.qachat.cap5.d": "Весовые коэффициенты для каждого из 15 критериев, адаптированные под ваш проект и бренд.",
    "show.qachat.cap6.t": "Безопасность данных",
    "show.qachat.cap6.d": "Все чаты обрабатываются конфиденциально, с локальным хранением и соответствием GDPR.",
    "show.qachat.th2": "ЧАТОВ В МЕСЯЦ",
    "show.qachat.th3": "ЦЕНА / ПРОВЕРЕННЫЙ ЧАТ",
    "show.qachat.bench.l": "ОРИЕНТИР ПО РУЧНОЙ ПРОВЕРКЕ",
    "show.qachat.bench.d": "Ручная проверка стоит ~$0,90 за чат — и покрывает лишь 10–15% трафика.",
    "show.qachat.curve.l": "КРИВАЯ ЭКОНОМИИ",
    "show.qachat.curve.d": "От 67% при 5 000 чатов до 80% от 200 000 в месяц, при охвате 100%.",
    "show.qachat.bill.l": "ЛОГИКА ОПЛАТЫ",
    "show.qachat.bill.d": "За проверенный чат. Без лицензий за место в QA-команде, без минимального размера команды.",
    "show.qachat.econlabel": "ЧАТОВ ПРОВЕРЕНО В МЕСЯЦ",
    "show.qachat.time1.t": "Интеграция с чат-системой",
    "show.qachat.time1.d": "Доступ на чтение к истории диалогов.",
    "show.qachat.time2.t": "Настройка критериев оценки",
    "show.qachat.time2.d": "15 критериев с весами под ваши стандарты.",
    "show.qachat.time3.t": "Калибровка под ваши стандарты",
    "show.qachat.time3.d": "Оценки сверены с вашими QA-менеджерами.",
    "show.qachat.time4.t": "Полноценная работа и аналитика",
    "show.qachat.time4.d": "Ежедневные отчёты по операторам и планы коучинга.",

    "show.payment.crumb": "03 / AI PAYMENT ASSISTANT",
    "show.payment.head": "«Где мой депозит?» — ответ за 10 секунд.",
    "show.payment.desc": "Данные о транзакции напрямую от PSP, тикеты создаются и обогащаются без оператора, PDF-чеки проверяются на подделку. Чат-бот открывает тикет, ассистент подхватывает его.",
    "show.payment.b1": "Статус транзакции от PSP в реальном времени",
    "show.payment.b2": "Тикеты открываются и обогащаются автоматически",
    "show.payment.b3": "Проверка чека на подделку перед выплатой",
    "show.payment.demolabel": "ЧАТ ИГРОКА · ПРИКРЕПИТЕ ЧЕК",
    "show.payment.attach": "ПРИКРЕПИТЬ ЧЕК.PDF",
    "show.payment.fake": "ПРИКРЕПИТЬ ПОДДЕЛЬНЫЙ",
    "show.payment.hood": "ПОД КАПОТОМ",
    "show.payment.stat1": "АВТОМАТИЧЕСКИ РЕШЕНО",
    "show.payment.stat2": "ВРЕМЯ НА ТИКЕТ",
    "show.payment.stat3": "ТИКЕТОВ ЗА ВСЁ ВРЕМЯ",
    "show.payment.perunit": "/ тикет",
    "show.payment.cap1.t": "Прямые данные от PSP",
    "show.payment.cap1.d": "Информация о транзакции берётся напрямую из платёжной системы.",
    "show.payment.cap2.t": "Внутренние API и PSP",
    "show.payment.cap2.d": "Интегрирован с платформой и провайдерами для бесперебойной работы.",
    "show.payment.cap3.t": "Автоматизация тикетов",
    "show.payment.cap3.d": "Создание и передача данных в платёжную систему без оператора.",
    "show.payment.cap4.t": "Проверка подлинности PDF",
    "show.payment.cap4.d": "AI-анализ выявляет поддельные чеки и документы до одобрения выплаты.",
    "show.payment.cap5.t": "Участие в обработке",
    "show.payment.cap5.d": "Затрагивает 90% платёжных тикетов, решает 45%+ вообще без участия человека.",
    "show.payment.cap6.t": "Встроен в чат",
    "show.payment.cap6.d": "Открывается прямо в диалоге с Chat Operator — игрок ничего не повторяет заново.",
    "show.payment.th2": "ТИКЕТОВ / МЕСЯЦ",
    "show.payment.th3": "ЦЕНА / ТИКЕТ",
    "show.payment.setup.l": "ПЛАТА ЗА ВНЕДРЕНИЕ",
    "show.payment.setup.d": "$200 разово за каждого подключённого платёжного провайдера.",
    "show.payment.bench.l": "ОРИЕНТИР ПО РУЧНОЙ ОБРАБОТКЕ",
    "show.payment.bench.d": "Ручная обработка стоит ~$0,50 за тикет при 3–5 минутах времени оператора.",
    "show.payment.example.l": "ПРИМЕР РАСЧЁТА",
    "show.payment.example.d": "100 000 тикетов · COMPANY · автоматизация 45% → экономия $13 500 в месяц, $162 000 в год.",
    "show.payment.econlabel": "ТИКЕТОВ В МЕСЯЦ",
    "show.payment.time1.t": "Интеграция тикетинга",
    "show.payment.time1.d": "Подключение хелпдеска и правила маршрутизации тикетов.",
    "show.payment.time2.t": "Подключение платёжных систем",
    "show.payment.time2.d": "API PSP, сопоставление статусов транзакций.",
    "show.payment.time3.t": "Калибровка под ваши стандарты",
    "show.payment.time3.d": "Правила эскалации и пороги фрод-контроля.",
    "show.payment.time4.t": "Полноценная работа и аналитика",
    "show.payment.time4.d": "Живые дашборды по возвратам и решениям.",

    "show.qacall.crumb": "04 / AI VOICE QA",
    "show.qacall.head": "Охват 2,6% становится 100%.",
    "show.qacall.desc": "Транскрибация Whisper плюс те же 15 критериев оценки на каждом входящем и исходящем звонке. Больше не нужен контролёр качества, чтобы знать, как общаются ваши операторы.",
    "show.qacall.b1": "Транскрибация Whisper для каждого звонка",
    "show.qacall.b2": "Те же 15 критериев оценки, что и в чат-QA",
    "show.qacall.b3": "Высвобождает 1–2 специалистов для стратегической работы",
    "show.qacall.demolabel": "ЗВОНОК №7 904 · 04:38 · КЛИКНИТЕ ПО ВОЛНЕ ДЛЯ ПЕРЕМОТКИ",
    "show.qacall.seg1": "Приветствие и идентификация",
    "show.qacall.seg2": "Отсутствует маркер эмпатии",
    "show.qacall.seg3": "Условия бонуса разъяснены",
    "show.qacall.seg4": "Предложен следующий шаг",
    "show.qacall.seg5": "Решение подтверждено",
    "show.qacall.pass": "OK",
    "show.qacall.flag": "ФЛАГ",
    "show.qacall.evdefault": "Транскрибировано Whisper, оценено по тем же 15 критериям, что и чат-QA.",
    "show.qacall.stat1": "ОХВАТ ЗВОНКОВ",
    "show.qacall.stat2": "ВРЕМЯ НА ПРОВЕРКУ",
    "show.qacall.stat3": "ЭКВИВАЛЕНТ В ЛЮДЯХ",
    "show.qacall.stat4": "УСЛОВИЯ",
    "show.qacall.individual": "индивидуально",
    "show.qacall.cap1.t": "Транскрибация Whisper",
    "show.qacall.cap1.d": "Каждый входящий и исходящий звонок превращается в текст с возможностью поиска.",
    "show.qacall.cap2.t": "Оценка по 15 критериям",
    "show.qacall.cap2.d": "Та же взвешенная модель, что и в чат-QA, откалиброванная под ваши скрипты звонков.",
    "show.qacall.cap3.t": "Таймкоды нарушений",
    "show.qacall.cap3.d": "Каждый флаг содержит точную секунду события, готовую для коучинга.",
    "show.qacall.cap4.t": "Специалисты высвобождены",
    "show.qacall.cap4.d": "1–2 контролёра качества переходят с выборочной проверки на стратегическую работу.",
    "show.qacall.cap5.t": "Статус продукта",
    "show.qacall.cap5.d": "Финальная стадия разработки, проходит комплексное тестирование; выгода подтверждена в тестовой среде.",
    "show.qacall.cap6.t": "Безопасность",
    "show.qacall.cap6.d": "Локальная обработка, записи шифруются, соответствие GDPR.",
    "show.qacall.th1": "РЕЖИМ",
    "show.qacall.th2": "ОХВАТ",
    "show.qacall.th3": "СТОИМОСТЬ",
    "show.qacall.row1": "ВРУЧНУЮ · 1–2 СПЕЦИАЛИСТА",
    "show.qacall.row1v": "~128 из 5 000 звонков · 2,6%",
    "show.qacall.row1c": "7,5 мин / звонок",
    "show.qacall.row2": "ВРУЧНУЮ · ПОЛНЫЙ ОХВАТ",
    "show.qacall.row2v": "5 000 звонков · 100%",
    "show.qacall.row2c": "78 человек · €15 620 / день",
    "show.qacall.row3v": "5 000 звонков · 100%",
    "show.qacall.row3c": "10 сек / звонок · 13,9 ч времени AI",
    "show.qacall.row4": "КОММЕРЧЕСКИЕ УСЛОВИЯ",
    "show.qacall.row4v": "по договорённости",
    "show.qacall.row4c": "зависит от объёма звонков",
    "show.qacall.why.l": "ПОЧЕМУ ДОГОВОРНАЯ ЦЕНА",
    "show.qacall.why.d": "Цена зависит от объёма обрабатываемых звонков и ваших конкретных требований.",
    "show.qacall.equiv.l": "ЭКВИВАЛЕНТ",
    "show.qacall.equiv.d": "AI-проверка 5 000 звонков в день равна 1,7 специалиста вместо 78.",
    "show.qacall.sec.l": "БЕЗОПАСНОСТЬ",
    "show.qacall.sec.d": "Локальная обработка, записи шифруются, соответствие GDPR.",
    "show.qacall.econlabel": "ЗВОНКОВ В ДЕНЬ",
    "show.qacall.time1.t": "Интеграция телефонии",
    "show.qacall.time1.d": "Доступ к записям звонков и правила хранения.",
    "show.qacall.time2.t": "Калибровка критериев",
    "show.qacall.time2.d": "15 критериев с весами под ваши скрипты.",
    "show.qacall.time3.t": "Пилотное тестирование",
    "show.qacall.time3.d": "Параллельный прогон против ваших контролёров.",
    "show.qacall.time4.t": "Полноценная работа",
    "show.qacall.time4.d": "100% звонков оцениваются автоматически.",

    "show.voice.crumb": "05 / AI VOICE BOT",
    "show.voice.head": "Звонки без колл-центра.",
    "show.voice.desc": "Заменяет команду исходящих звонков — 24/7, несколько языков одновременно, всегда по скрипту. Один бот берёт в 10 раз больше ежедневных разговоров, чем команда из 2,5 операторов.",
    "show.voice.b1": "2 500 разговоров в день, 24/7",
    "show.voice.b2": "Несколько языков одновременно, всегда по скрипту",
    "show.voice.b3": "Без больничных, простоев и текучки",
    "show.voice.demolabel": "ОЧЕРЕДЬ ИСХОДЯЩИХ · СЕГОДНЯ",
    "show.voice.evdefault": "Один бот ведёт все языки одновременно — выберите один, чтобы увидеть разбивку по кампании в реальном времени.",
    "show.voice.stat1": "РАЗГОВОРОВ / ДЕНЬ",
    "show.voice.stat2": "ЭКОНОМИЯ В МЕСЯЦ",
    "show.voice.stat3": "ЭКОНОМИЯ В ГОД",
    "show.voice.perunit": "/ минута",
    "show.voice.cap1.t": "Исходящие в масштабе",
    "show.voice.cap1.d": "2 500 разговоров в день против 250 у команды из 2,5 операторов.",
    "show.voice.cap2.t": "Многоязычные кампании",
    "show.voice.cap2.d": "Несколько языков работают одновременно без дополнительного найма.",
    "show.voice.cap3.t": "Всегда по скрипту",
    "show.voice.cap3.d": "Сценарии, отработка возражений и комплаенс-формулировки никогда не отклоняются.",
    "show.voice.cap4.t": "Запуск из CRM",
    "show.voice.cap4.d": "Звонки запускаются по триггерам CRM, результаты автоматически возвращаются обратно.",
    "show.voice.cap5.t": "Без скрытых затрат на персонал",
    "show.voice.cap5.d": "Без зарплаты, налогов, офиса, обучения, текучки и простоев.",
    "show.voice.cap6.t": "Вмешательство оператора",
    "show.voice.cap6.d": "Мониторинг в реальном времени с возможностью подключения человека в любой момент.",
    "show.voice.th1": "МИНУТ / МЕСЯЦ",
    "show.voice.th2": "ЦЕНА / МИН",
    "show.voice.range1": "До 20 000",
    "show.voice.range4": "От 100 000",
    "show.voice.setup.l": "ПЛАТА ЗА ВНЕДРЕНИЕ",
    "show.voice.setup.d": "€1000 разово.",
    "show.voice.bench.l": "ОРИЕНТИР ПО ЖИВЫМ ОПЕРАТОРАМ",
    "show.voice.bench.d": "~€0,40 за минуту разговора без учёта затрат на HR, офис и простои.",
    "show.voice.labour.l": "АНАЛИЗ ТРУДОЗАТРАТ",
    "show.voice.labour.d": "2,5 оператора стоят €5 375 в месяц; бот покрывает те же 23 500 минут за €2 820.",
    "show.voice.econlabel": "МИНУТ В МЕСЯЦ",
    "show.voice.time1.t": "Настройка скриптов звонков",
    "show.voice.time1.d": "Сценарии, возражения, комплаенс-формулировки.",
    "show.voice.time2.t": "Интеграция с CRM и телефонией",
    "show.voice.time2.d": "Триггеры, номера, сопоставление результатов звонков.",
    "show.voice.time3.t": "Тестовые звонки",
    "show.voice.time3.d": "Калибровка голоса, задержки и скрипта.",
    "show.voice.time4.t": "Массовые исходящие звонки",
    "show.voice.time4.d": "Мониторинг в реальном времени, доступно вмешательство оператора.",

    "console.today": "СЕГОДНЯ",
    "console.7d": "7Д",
    "console.30d": "30Д",
    "console.intent1": "СТАТУС ВЫПЛАТЫ",
    "console.intent2": "БОНУС / ВЕЙДЖЕР",
    "console.intent3": "ДОКУМЕНТЫ KYC",
    "console.intent4": "ОШИБКА ДЕПОЗИТА",
    "console.intent5": "ОТВЕТСТВЕННАЯ ИГРА",
    "console.th.ticket": "ТИКЕТ",
    "console.th.summary": "ОПИСАНИЕ",
    "console.th.reason": "ПРИЧИНА",
    "console.th.waiting": "ОЖИДАНИЕ",
    "console.th.sla": "SLA",
    "console.t1.sum": "Спор о чарджбэке, €1 200",
    "console.t2.sum": "Запрос на отмену самоисключения",
    "console.t3.sum": "Захват аккаунта, 3 неудачные 2FA",
    "console.t4.sum": "Переговоры о VIP-бонусе",
    "console.cat.financial": "ФИНАНСЫ",
    "console.cat.compliance": "КОМПЛАЕНС",
    "console.cat.fraud": "ФРОД",
    "console.cat.commercial": "КОММЕРЦИЯ",
    "console.ok": "OK",
    "console.priority": "ПРИОРИТЕТ",
    "console.scoredago": "ОЦЕНЕНО АВТОМАТИЧЕСКИ · 1,9 С НАЗАД",
    "console.player": "ИГРОК",
    "console.agent": "АГЕНТ",
    "console.tr1": "Мой вывод средств висит уже 3 часа.",
    "console.tr2": "Здравствуйте, это Марта. Подтвердите, пожалуйста, e-mail на аккаунте?",
    "console.tr4": "€400 на Skrill уже у провайдера, ETA 40 минут.",
    "console.kbmatch": "↳ СОВПАДЕНИЕ С БЗ v.412 · ТОЧНОСТЬ 99",
    "console.tr5": "А что с моим бонусом?",
    "console.tr6": "Вейджер закрыт, ничто не блокирует выплату.",
    "console.tonematch": "↳ НЕТ ПРИЗНАНИЯ 3-ЧАСОВОГО ОЖИДАНИЯ · ТОН 88",
    "console.tr7": "Хорошо, спасибо.",
    "console.crit1": "ПРИВЕТСТВИЕ И ID",
    "console.crit2": "ТОЧНОСТЬ БЗ",
    "console.crit3": "ТОН ГОЛОСА",
    "console.crit4": "СЛЕДУЮЩИЙ ШАГ",
    "console.crit5": "ЗАВЕРШЕНИЕ",
    "console.coachnote": "Признайте ожидание, прежде чем называть ETA. Автоматически назначено на следующий 1:1 с Мартой.",
    "console.pspsync": "ПОДКЛЮЧЕНО 4 PSP · СИНХРОНИЗАЦИЯ 12 С",
    "console.detected": "ОБНАРУЖЕНО",
    "console.p1": "PIX-депозит не зачислен",
    "console.p2": "Карта отклонена, код 05",
    "console.p3": "Вывод средств в ожидании",
    "console.psplookup": "ЗАПРОС К PSP",
    "console.p4": "Trustly · статус PENDING",
    "console.p4b": "ETA 40 мин · подтверждено",
    "console.p5": "Skrill · зачислено",
    "console.p5b": "зачислено 00:03 назад",
    "console.autoresolved": "АВТОМАТИЧЕСКИ РЕШЕНО",
    "console.p6": "Ссылка на повтор отправлена, депозит ок",
    "console.noop1": "1,4 с · без оператора",
    "console.p7": "Срок выплаты разъяснён",
    "console.noop2": "1,1 с · без оператора",
    "console.p8": "Несоответствие кошелька исправлено",
    "console.noop3": "0,9 с · без оператора",
    "console.escalated": "ЭСКАЛИРОВАНО",
    "console.p9": "Спор о чарджбэке €1 200",
    "console.p9b": "финансы · полный контекст",
    "console.pipestat": "96,7% платёжных тикетов сегодня не доходят до человека.",

    "calc.reduction": "СНИЖЕНИЕ ЗАТРАТ",
    "calc.row.chat": "AI CHAT OPERATOR",
    "calc.row.qa": "AI QA SYSTEM",
    "calc.row.payment": "AI PAYMENT ASSISTANT",
    "calc.row.voice": "AI VOICE BOT",
    "calc.setupfees": "РАЗОВАЯ ПЛАТА ЗА ВНЕДРЕНИЕ",

    "price.th.product": "ПРОДУКТ",
    "price.th.setup": "ПЛАТА ЗА ВНЕДРЕНИЕ",
    "price.row.chat": "AI CHAT OPERATOR · ЗА ЗАКРЫТЫЙ ЧАТ",
    "price.row.qa": "AI QA SYSTEM · ЗА ПРОВЕРЕННЫЙ ЧАТ",
    "price.row.payment": "AI PAYMENT ASSISTANT · ЗА ТИКЕТ",
    "price.row.voice": "AI VOICE BOT · ЗА МИНУТУ",
    "price.row.qacall": "AI VOICE QA · ЗА ЗВОНОК",
    "price.row.qacall.note": "индивидуальные условия — зависят от объёма звонков и требований",

    "rail.1": "01 ВВЕДЕНИЕ",
    "rail.2": "02 АГЕНТЫ",
    "rail.3": "03 КОНСОЛЬ",
    "rail.4": "04 ПРОЦЕСС",
    "rail.5": "05 ТРАФИК",
    "rail.6": "06 ЭКОНОМИКА",
    "rail.7": "07 КАЛЬКУЛЯТОР",
    "rail.8": "08 ЦЕНЫ",
    "rail.9": "09 ВНЕДРЕНИЕ",
    "rail.10": "10 КОНТАКТЫ",

    "foot.tagline": "Пять AI-агентов на одной платформе для поддержки iGaming: чат, контроль качества, платежи, голос. Единая база знаний, единая консоль, единый счёт.",
    "foot.emailus": "НАПИСАТЬ НАМ",
    "foot.agents": "АГЕНТЫ",
    "foot.platform": "ПЛАТФОРМА",
    "foot.console": "Консоль оператора",
    "foot.livetraffic": "Живой трафик",
    "foot.econ": "Экономика",
    "foot.roicalc": "Калькулятор ROI",
    "foot.pricing": "Цены",
    "foot.rollout": "План внедрения",
    "foot.contact": "КОНТАКТЫ",
    "foot.reqcalc": "Запросить расчёт",
    "foot.response": "ОТВЕТ В ТЕЧЕНИЕ 1 РАБОЧЕГО ДНЯ",
    "foot.bottom1": "QODEQ · AI-ПЛАТФОРМА ДЛЯ IGAMING",
    "foot.bottom2": "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ · 2026 · КОНФИДЕНЦИАЛЬНО",

    "econ.totalreduction": "ОБЩЕЕ СНИЖЕНИЕ ЗАТРАТ · РАСТЁТ С ОБЪЁМОМ",

    "hero.s2.unit": "дней",
    "hero.s3.unit": "любой язык",

    "proc.risk.label": "МИНИМИЗАЦИЯ РИСКОВ",
    "proc.risk.desc": "Постепенное внедрение с возможностью отката, резервные операторы остаются на линии на период адаптации.",

    "econ.perchat": "за чат",
    "econ.stat.monthly": "ЭКОНОМИЯ В МЕСЯЦ ПРИ 1 МЛН ЧАТОВ",
    "econ.stat.annual": "ЭКОНОМИЯ В ГОД ПРИ 1 МЛН ЧАТОВ",
    "econ.stat.qaequiv": "ЭКВИВАЛЕНТ РУЧНОГО QA В ДЕНЬ · 78 СПЕЦИАЛИСТОВ",

    "time.step1.wk": "НЕДЕЛЯ 1–2",
    "time.step1.title": "Техническая интеграция",
    "time.step1.desc": "Доступ к платформе, хелпдеску и телефонии.",
    "time.step2.wk": "НЕДЕЛЯ 3–4",
    "time.step2.title": "Настройка и обучение",
    "time.step2.desc": "База знаний, критерии оценки, тон общения.",
    "time.step3.wk": "НЕДЕЛЯ 5–6",
    "time.step3.title": "Тестирование и оптимизация",
    "time.step3.desc": "Теневой режим и калибровка по операторам.",
    "time.step4.wk": "НЕДЕЛЯ 7+",
    "time.step4.title": "Полноценная работа и экономия",
    "time.step4.desc": "Живые дашборды и ежемесячные отчёты."
  }
};
