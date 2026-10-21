// QODEQ business-case PDF for /calculator. Loaded on demand (first click on the PDF
// button), builds a one-page A4 document in the browser with jsPDF — real vector text,
// selectable and searchable. Space Grotesk has no Cyrillic, so the PDF uses Inter +
// JetBrains Mono (both self-hosted in /assets/fonts) for EN and RU alike.
window.QODEQ_CALC_PDF = (function () {
  var JSPDF_SRC = '/assets/vendor/jspdf.umd.min.js';
  var FONTS = [
    ['Inter-Regular.ttf', 'Inter', 'normal'],
    ['Inter-SemiBold.ttf', 'Inter', 'bold'],
    ['JetBrainsMono-Regular.ttf', 'Mono', 'normal']
  ];
  var LOGO = '/assets/brand/logo-main.png?v=2';

  var C = {
    ink: [17, 17, 15], body: [70, 67, 60], muted: [122, 117, 106], faint: [168, 163, 152],
    line: [226, 223, 216], soft: [246, 244, 239], dark: [10, 10, 9], gold: [232, 178, 58], goldInk: [168, 120, 18],
    chat: [79, 209, 165], qa: [232, 178, 58], pay: [95, 165, 249], voice: [244, 121, 76]
  };

  var T = {
    en: {
      doc: 'AI SUPPORT BUSINESS CASE', title: 'What player support costs today — and with AI',
      lead: function (d) { return 'Monthly saving ' + d.save + ' (' + d.pct + '% less than people only). Setup pays back in ' + d.payback + '.'; },
      k: ['MONTHLY SAVING', 'ANNUAL SAVING', 'COST REDUCTION', 'SETUP PAYS BACK IN', 'ONE-OFF SETUP', 'WORK TAKEN BY AI'],
      fte: ' full-time operators', people: 'Support with people only', withq: 'Support with QODEQ', perMonth: ' / month',
      bk: 'WHERE THE SAVING COMES FROM · MONTHLY', th: ['PRODUCT', 'VOLUME', 'PLAN · RATE', 'PEOPLE', 'QODEQ', 'SAVING'], total: 'Total per month',
      chart: 'CUMULATIVE COST OVER 12 MONTHS', lgPeople: 'People only', lgQ: 'With QODEQ (incl. setup)', be: 'break-even', saved12: ' saved in 12 months',
      asm: 'ASSUMPTIONS', how: 'HOW THE MODEL WORKS',
      a: {
        opCost: 'Operator cost per month (fully loaded)', opChats: 'Chats one operator closes per month', perContact: 'Cost of a chat / payment ticket handled by a person',
        autom: 'Chats closed by AI end-to-end', payShare: 'Payment tickets resolved by the bot', psp: 'Payment providers connected',
        qaCost: 'Manual QA cost per checked chat', vCost: 'Human agent cost per call minute', defaults: 'market average', custom: 'your number'
      },
      m: {
        chat: 'AI Chat Operator: chats × AI share × tier rate + remaining chats × your cost per chat. Tiers: $0.30 below 30K chats/month, $0.25 to 50K, $0.20 to 100K, $0.18 above.',
        qa: 'AI QA System: every chat checked × QA tier rate vs chats × manual QA cost. Tiers: $0.30 below 30K, $0.25 to 100K, $0.20 to 200K, $0.18 above.',
        pay: 'AI Payment Assistant: tickets × bot share × tier rate + remaining tickets × your cost per ticket. Tiers: $0.30 up to 10K, $0.25 to 50K, $0.20 to 100K, $0.18 above. Setup $200 per PSP.',
        voice: 'AI Voice Bot: minutes × tier rate vs minutes × human cost per minute. Tiers: $0.15 up to 20K min, $0.12 to 50K, $0.09 to 100K, $0.06 above.',
        all: 'Billing is per unit of work, never per seat. The whole monthly volume is billed at the rate of the tier it falls into. Setup is one-off: $1,000 Chat Operator, $1,000 QA, $200 per PSP, $1,000 Voice Bot.'
      },
      note: 'List prices, USD, excl. VAT. Final terms are confirmed in the commercial proposal.',
      open: 'Open and adjust this calculation online →', contacts: 'qodeq.net  ·  support@qodeq.net  ·  t.me/qodeq',
      file: 'QODEQ-business-case'
    },
    ru: {
      doc: 'БИЗНЕС-КЕЙС: AI-ПОДДЕРЖКА', title: 'Сколько стоит поддержка игроков сейчас — и с AI',
      lead: function (d) { return 'Экономия в месяц ' + d.save + ' (на ' + d.pct + '% дешевле, чем только людьми). Внедрение окупится за ' + d.payback.replace(/\.$/, '') + '.'; },
      k: ['ЭКОНОМИЯ В МЕСЯЦ', 'ЭКОНОМИЯ В ГОД', 'СНИЖЕНИЕ ЗАТРАТ', 'ОКУПАЕМОСТЬ ВНЕДРЕНИЯ', 'РАЗОВОЕ ВНЕДРЕНИЕ', 'РАБОТА, СНЯТАЯ AI'],
      fte: ' операторов на полную ставку', people: 'Поддержка только людьми', withq: 'Поддержка с QODEQ', perMonth: ' / мес',
      bk: 'ОТКУДА ЭКОНОМИЯ · В МЕСЯЦ', th: ['ПРОДУКТ', 'ОБЪЁМ', 'ТАРИФ · СТАВКА', 'ЛЮДИ', 'QODEQ', 'ЭКОНОМИЯ'], total: 'Итого в месяц',
      chart: 'НАКОПЛЕННЫЕ ЗАТРАТЫ ЗА 12 МЕСЯЦЕВ', lgPeople: 'Только люди', lgQ: 'С QODEQ (с внедрением)', be: 'окупаемость', saved12: ' экономии за 12 месяцев',
      asm: 'ДОПУЩЕНИЯ', how: 'КАК УСТРОЕНА МОДЕЛЬ',
      a: {
        opCost: 'Стоимость оператора в месяц (полная)', opChats: 'Чатов закрывает один оператор в месяц', perContact: 'Стоимость чата / платёжного тикета у человека',
        autom: 'Чатов закрывает AI от начала до конца', payShare: 'Платёжных тикетов решает бот', psp: 'Подключаемых платёжных провайдеров',
        qaCost: 'Ручной QA за проверку чата', vCost: 'Живой оператор за минуту звонка', defaults: 'среднее по рынку', custom: 'ваша цифра'
      },
      m: {
        chat: 'AI Chat Operator: чаты × доля AI × ставка тарифа + остальные чаты × ваша стоимость чата. Тарифы: $0,30 до 30K чатов в месяц, $0,25 до 50K, $0,20 до 100K, $0,18 выше.',
        qa: 'AI QA System: каждый чат × ставка QA против чатов × стоимость ручной проверки. Тарифы: $0,30 до 30K, $0,25 до 100K, $0,20 до 200K, $0,18 выше.',
        pay: 'AI Payment Assistant: тикеты × доля бота × ставка тарифа + остальные тикеты × ваша стоимость тикета. Тарифы: $0,30 до 10K, $0,25 до 50K, $0,20 до 100K, $0,18 выше. Внедрение $200 за каждого PSP.',
        voice: 'AI Voice Bot: минуты × ставка тарифа против минут × стоимость минуты оператора. Тарифы: $0,15 до 20K минут, $0,12 до 50K, $0,09 до 100K, $0,06 выше.',
        all: 'Оплата — за единицу работы, а не за рабочее место. Весь месячный объём тарифицируется по ставке того тарифа, в который попадает. Внедрение разовое: $1 000 Chat Operator, $1 000 QA, $200 за PSP, $1 000 Voice Bot.'
      },
      note: 'Прайсовые цены, USD, без НДС. Финальные условия фиксируются в коммерческом предложении.',
      open: 'Открыть и изменить этот расчёт онлайн →', contacts: 'qodeq.net  ·  support@qodeq.net  ·  t.me/qodeq',
      file: 'QODEQ-biznes-keis'
    }
  };

  var ready = null;
  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (window.jspdf) return res();
      var s = document.createElement('script');
      s.src = src; s.onload = function () { res(); }; s.onerror = function () { rej(new Error('jsPDF failed to load')); };
      document.head.appendChild(s);
    });
  }
  function b64(buf) {
    var bytes = new Uint8Array(buf), out = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) out += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(out);
  }
  function dataUrl(url) {
    return fetch(url).then(function (r) { return r.blob(); }).then(function (blob) {
      return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(blob); });
    });
  }
  // jsPDF + three fonts + the logo, fetched once and reused for every later download
  function prepare() {
    if (ready) return ready;
    ready = Promise.all([
      loadScript(JSPDF_SRC),
      Promise.all(FONTS.map(function (f) { return fetch('/assets/fonts/' + f[0]).then(function (r) { if (!r.ok) throw new Error(f[0]); return r.arrayBuffer(); }).then(b64); })),
      dataUrl(LOGO)
    ]).then(function (r) { return { fonts: r[1], logo: r[2] }; });
    ready.catch(function () { ready = null; });
    return ready;
  }

  function usd(x) { return '$' + Math.round(x).toLocaleString('en-US'); }
  function num(x) { return Math.round(x).toLocaleString('en-US'); }

  // d: { lang, m (model + fte/pct/payback), s (state), def (defaults), rows: [{key,name,vol,plan,without,with}], url }
  function build(d) {
    return prepare().then(function (assets) {
      var t = T[d.lang] || T.en, m = d.m, s = d.s;
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
      FONTS.forEach(function (f, i) { doc.addFileToVFS(f[0], assets.fonts[i]); doc.addFont(f[0], f[1], f[2]); });

      var W = 210, H = 297, X = 16, R = W - 16, CW = R - X;
      function font(name, style, size, color) { doc.setFont(name, style); doc.setFontSize(size); doc.setTextColor.apply(doc, color); }
      function label(txt, x, y, color, opts) { font('Mono', 'normal', 6.6, color || C.muted); doc.setCharSpace(0.45); doc.text(txt, x, y, opts || {}); doc.setCharSpace(0); }
      function fill(c) { doc.setFillColor.apply(doc, c); }
      function stroke(c, w) { doc.setDrawColor.apply(doc, c); doc.setLineWidth(w || 0.2); }

      // ---- header band
      fill(C.dark); doc.rect(0, 0, W, 30, 'F');
      doc.addImage(assets.logo, 'PNG', X, 9.5, 40.4, 11);
      var date = new Date().toLocaleDateString(d.lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      label(t.doc, R, 13.5, C.gold, { align: 'right' });
      font('Inter', 'normal', 8.5, [190, 185, 175]); doc.text(date, R, 19.5, { align: 'right' });

      // ---- title + lead
      var y = 43;
      font('Inter', 'bold', 17, C.ink); doc.text(t.title, X, y);
      y += 7;
      font('Inter', 'normal', 10, C.body);
      doc.text(doc.splitTextToSize(t.lead({ save: usd(m.save), pct: m.pct, payback: m.payback }), CW), X, y);

      // ---- KPI grid 3 x 2
      y += 7;
      var kv = [usd(m.save), usd(m.save * 12), m.pct + '%', m.payback, usd(m.setup), (m.fte >= 10 ? Math.round(m.fte) : m.fte.toFixed(1)) + ''];
      var bw = CW / 3, bh = 15.5;
      for (var i = 0; i < 6; i++) {
        var bx = X + (i % 3) * bw, by = y + Math.floor(i / 3) * bh;
        fill(i === 0 ? [253, 246, 230] : C.soft); doc.rect(bx, by, bw - 1.5, bh - 1.5, 'F');
        label(t.k[i], bx + 4, by + 5, i < 2 ? C.goldInk : C.muted);
        font('Inter', 'bold', i < 2 ? 14.5 : 13, i < 2 ? C.goldInk : C.ink);
        doc.text(kv[i], bx + 4, by + 11.4);
        if (i === 5) { var vw = doc.getTextWidth(kv[i]); font('Inter', 'normal', 7.5, C.muted); doc.text(t.fte, bx + 4 + vw + 1, by + 11.4); }
      }
      y += bh * 2 + 5;

      // ---- people vs QODEQ bars
      [[t.people, m.without, [150, 145, 135]], [t.withq, m.withAi, C.gold]].forEach(function (r, i) {
        font('Inter', i ? 'bold' : 'normal', 9.5, C.ink); doc.text(r[0], X, y);
        font('Inter', 'bold', 11, C.ink); doc.text(usd(r[1]) + t.perMonth, R, y, { align: 'right' });
        fill([236, 233, 226]); doc.rect(X, y + 1.8, CW, 2, 'F');
        fill(r[2]); doc.rect(X, y + 1.8, Math.max(1, CW * (m.without > 0 ? r[1] / m.without : 0)), 2, 'F');
        y += 9;
      });

      // ---- breakdown table
      y += 3;
      label(t.bk, X, y); y += 5;
      // product | volume | plan · rate | people | qodeq | saving  (last three right-aligned)
      var cols = [X, X + 46, X + 72, R - 48, R - 24, R];
      t.th.forEach(function (h, i) { label(h, cols[i], y, C.faint, i >= 3 ? { align: 'right' } : {}); });
      y += 2.5;
      stroke(C.line); doc.line(X, y, R, y);
      d.rows.forEach(function (r) {
        y += 5.4;
        fill(C[r.key]); doc.rect(X, y - 2.5, 2.2, 2.2, 'F');
        font('Inter', 'bold', 8.8, C.ink); doc.text(r.name, X + 4, y);
        font('Mono', 'normal', 7.6, C.body); doc.text(r.vol, cols[1], y); doc.text(r.plan, cols[2], y);
        font('Mono', 'normal', 8, C.body);
        doc.text(usd(r.without), cols[3], y, { align: 'right' });
        doc.text(usd(r.with), cols[4], y, { align: 'right' });
        font('Mono', 'normal', 8, C.goldInk); doc.text(usd(r.without - r.with), cols[5], y, { align: 'right' });
        y += 2.6; stroke(C.line); doc.line(X, y, R, y);
      });
      y += 5.6;
      font('Inter', 'bold', 9.2, C.ink); doc.text(t.total, X, y);
      font('Mono', 'normal', 8.4, C.ink); doc.text(usd(m.without), cols[3], y, { align: 'right' }); doc.text(usd(m.withAi), cols[4], y, { align: 'right' });
      font('Mono', 'normal', 8.4, C.goldInk); doc.text(usd(m.save), cols[5], y, { align: 'right' });

      // ---- 12-month chart
      y += 9;
      label(t.chart, X, y);
      var gx = X, gy = y + 3, gw = CW, gh = 30;
      fill(C.soft); doc.rect(gx, gy, gw, gh, 'F');
      var people = [], ai = [];
      for (var k = 0; k <= 12; k++) { people.push(m.without * k); ai.push(m.setup + m.withAi * k); }
      var max = Math.max(people[12], ai[12], 1), pl = 4, pr = 4, pt = 5, pb = 7;
      function cx(k) { return gx + pl + (gw - pl - pr) * k / 12; }
      function cy(v) { return gy + pt + (gh - pt - pb) * (1 - v / max); }
      stroke([228, 225, 218], 0.15);
      for (var g = 0; g <= 4; g++) { var yy = gy + pt + (gh - pt - pb) * g / 4; doc.line(gx + pl, yy, gx + gw - pr, yy); }
      font('Mono', 'normal', 6.5, C.faint);
      [0, 3, 6, 9, 12].forEach(function (k) { doc.text((d.lang === 'ru' ? 'М' : 'M') + k, cx(k), gy + gh - 2, { align: k === 0 ? 'left' : k === 12 ? 'right' : 'center' }); });
      function poly(a, c, w) { stroke(c, w); for (var k = 1; k <= 12; k++) doc.line(cx(k - 1), cy(a[k - 1]), cx(k), cy(a[k])); }
      poly(people, [150, 145, 135], 0.45);
      poly(ai, C.gold, 0.8);
      if (m.save > 0) {
        var be = m.setup / m.save;
        if (be <= 12) {
          fill(C.gold); doc.circle(cx(be), cy(m.without * be), 1, 'F');
          font('Mono', 'normal', 6.5, C.goldInk); doc.text(t.be, cx(be) + 2.5, cy(m.without * be) + 3.2);
        }
        // saving label sits in the top-left corner, clear of both lines
        font('Inter', 'bold', 10, C.ink);
        doc.text('+' + usd(people[12] - ai[12]) + t.saved12, gx + pl + 2, gy + pt + 3);
      }
      y = gy + gh + 4.5;
      fill([150, 145, 135]); doc.rect(X, y - 1, 5, 0.6, 'F'); font('Inter', 'normal', 7.5, C.muted); doc.text(t.lgPeople, X + 7, y);
      var lw = doc.getTextWidth(t.lgPeople);
      fill(C.gold); doc.rect(X + 12 + lw, y - 1.1, 5, 0.9, 'F'); doc.text(t.lgQ, X + 19 + lw, y);

      // ---- assumptions (left) + how the model works (right) — measured first, and moved
      // to a second page if they would run into the footer
      var colW = (CW - 10) / 2, A = t.a;
      var asm = [
        [A.opCost, usd(s.opCost), s.opCost !== d.def.opCost],
        [A.opChats, num(s.opChats), s.opChats !== d.def.opChats],
        [A.perContact, '$' + m.perContact.toFixed(2), s.opCost !== d.def.opCost || s.opChats !== d.def.opChats]
      ];
      if (s.chat) asm.push([A.autom, s.autom + '%', false]);
      if (s.pay) { asm.push([A.payShare, s.payShare + '%', s.payShare !== d.def.payShare]); asm.push([A.psp, String(s.psp), false]); }
      if (s.qa) asm.push([A.qaCost, '$' + s.qaCost.toFixed(2), s.qaCost !== d.def.qaCost]);
      if (s.voice) asm.push([A.vCost, '$' + s.vCost.toFixed(2), s.vCost !== d.def.vCost]);
      var how = [];
      if (s.chat) how.push(t.m.chat);
      if (s.qa) how.push(t.m.qa);
      if (s.pay) how.push(t.m.pay);
      if (s.voice) how.push(t.m.voice);
      how.push(t.m.all);

      font('Inter', 'normal', 7.6, C.body);
      var asmH = 5 + asm.reduce(function (h, a) { return h + Math.max(doc.splitTextToSize(a[0], colW - 20).length * 3.3, a[2] ? 5.4 : 3.3) + 2.1; }, 0);
      font('Inter', 'normal', 7.2, C.body);
      var howH = 5 + how.reduce(function (h, p) { return h + doc.splitTextToSize(p, colW).length * 3.05 + 2; }, 0);

      var FOOT = H - 20;
      function footer() {
        stroke(C.line); doc.line(X, FOOT, R, FOOT);
        font('Inter', 'normal', 7.2, C.muted); doc.text(t.note, X, FOOT + 5);
        font('Inter', 'bold', 8.5, C.goldInk); doc.textWithLink(t.open, X, FOOT + 11, { url: d.url });
        font('Mono', 'normal', 7.5, C.muted); doc.text(t.contacts, R, FOOT + 11, { align: 'right' });
      }
      y += 8;
      if (y + Math.max(asmH, howH) > FOOT - 3) {
        footer();
        doc.addPage();
        fill(C.dark); doc.rect(0, 0, W, 14, 'F');
        doc.addImage(assets.logo, 'PNG', X, 4, 22, 6);
        label(t.doc, R, 8.6, C.gold, { align: 'right' });
        y = 28;
      }

      var ay = y, my = y, ax = X, mx = X + colW + 10;
      label(t.asm, ax, ay); ay += 5;
      asm.forEach(function (a) {
        font('Inter', 'normal', 7.6, C.body);
        var lines = doc.splitTextToSize(a[0], colW - 20);
        doc.text(lines, ax, ay);
        font('Mono', 'normal', 8, C.ink); doc.text(a[1], ax + colW, ay, { align: 'right' });
        if (a[2]) { font('Mono', 'normal', 5.6, C.goldInk); doc.text(A.custom.toUpperCase(), ax + colW, ay + 2.9, { align: 'right' }); }
        ay += Math.max(lines.length * 3.3, a[2] ? 5.4 : 3.3) + 2.1;
      });
      label(t.how, mx, my); my += 5;
      font('Inter', 'normal', 7.2, C.body);
      how.forEach(function (p) { var l = doc.splitTextToSize(p, colW); doc.text(l, mx, my, { lineHeightFactor: 1.2 }); my += l.length * 3.05 + 2; });

      footer();

      var stamp = new Date().toISOString().slice(0, 10);
      doc.save(t.file + '-' + stamp + '.pdf');
      return true;
    });
  }

  return { prepare: prepare, build: build };
})();
