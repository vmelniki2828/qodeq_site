/*
 * QODEQ — откуда пришёл посетитель. Подключён на всех страницах сразу после gtag:
 *   <script src="/attrib.js?v=1"></script>
 *
 * В localStorage (ключ qodeq_attrib_v1) хранятся два касания:
 *   first — самый первый визит, не перезаписывается;
 *   last  — последний визит с UTM / click-id или с внешнего сайта.
 * Касание: utm_*, gclid/fbclid/yclid, внешний referrer, страница входа, время.
 *
 * Формы отправляют QODEQ_ATTRIB.get() вместе с заявкой (поле attrib),
 * а после успешной отправки зовут QODEQ_ATTRIB.trackLead() — событие GA4 generate_lead.
 * Без localStorage (приватный режим) всё работает по текущему визиту.
 */
(function () {
  var KEY = 'qodeq_attrib_v1';
  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'yclid'];

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function write(v) {
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
  }

  var touch = {}, tagged = false;
  try {
    var q = new URLSearchParams(location.search);
    PARAMS.forEach(function (k) {
      var v = q.get(k);
      if (v) { touch[k] = v.slice(0, 200); tagged = true; }
    });
  } catch (e) {}

  var external = false;
  try {
    if (document.referrer && new URL(document.referrer).hostname !== location.hostname) {
      touch.referrer = document.referrer.slice(0, 300);
      external = true;
    }
  } catch (e) {}

  touch.landing = (location.pathname + location.search).slice(0, 300);
  touch.ts = new Date().toISOString();

  // переходы внутри сайта (без UTM и с нашим же referrer) касанием не считаются
  var data = read();
  if (!data.first) data.first = touch;
  if (tagged || external || !data.last) data.last = touch;
  write(data);

  window.QODEQ_ATTRIB = {
    get: function () {
      var d = read();
      return { first: d.first || touch, last: d.last || touch };
    },
    // method — где оставили заявку: homepage / product_page / calculator / ...
    trackLead: function (method, product) {
      if (typeof gtag !== 'function') return;
      gtag('event', 'generate_lead', { method: method, product: product || '' });
    }
  };
})();
