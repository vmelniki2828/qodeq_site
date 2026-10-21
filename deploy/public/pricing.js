// QODEQ list prices — the single source of truth for every calculator on the site
// (homepage ROI model, homepage product showcase, /calculator). Change a price here,
// bump ?v= on the <script> tags, and every page picks it up.
//
// Tier boundaries follow the official commercial deck:
//   exclusive: true  — the boundary value belongs to the NEXT tier ("5K—30K", "30K—50K":
//                      30,000 is already NORMAL). Chat and QA Chat.
//   exclusive: false — the boundary value stays in the CURRENT tier ("up to 10,000",
//                      "up to 20,000"). Payment and Voice — the deck's own worked examples
//                      price 50,000 tickets at NORMAL $0.25.
// The whole volume is billed at the tier's rate (not graduated).
window.QODEQ_PRICING = (function () {
  var PRODUCTS = {
    chat: {
      tiers: [[30000, 'EASY', 0.30], [50000, 'NORMAL', 0.25], [100000, 'COMPANY', 0.20], [Infinity, 'CORPORATION', 0.18]],
      exclusive: true, setup: 1000, unit: 'chat'
    },
    qa: {
      tiers: [[30000, 'EASY', 0.30], [100000, 'NORMAL', 0.25], [200000, 'COMPANY', 0.20], [Infinity, 'CORPORATION', 0.18]],
      exclusive: true, setup: 1000, unit: 'chat'
    },
    payment: {
      tiers: [[10000, 'EASY', 0.30], [50000, 'NORMAL', 0.25], [100000, 'COMPANY', 0.20], [Infinity, 'CORPORATION', 0.18]],
      exclusive: false, setup: 200, setupPer: 'psp', unit: 'ticket'
    },
    voice: {
      tiers: [[20000, 'EASY', 0.15], [50000, 'NORMAL', 0.12], [100000, 'COMPANY', 0.09], [Infinity, 'CORPORATION', 0.06]],
      exclusive: false, setup: 1000, unit: 'minute'
    }
  };

  // What the same work costs with people only — used when the visitor doesn't enter
  // their own numbers.
  var BASELINE = {
    chat: 0.50,      // operator cost per closed chat
    qaManual: 0.90,  // manual QA cost per checked chat
    ticket: 0.50,    // operator cost per payment ticket
    voiceMin: 0.40   // human agent cost per call minute
  };

  var DEFAULTS = {
    autom: 65,       // % of chats closed by AI
    payShare: 45     // % of payment tickets resolved by the bot
  };

  // -> { plan, rate, index, next: { plan, rate, from } | null }
  function tier(product, volume) {
    var p = PRODUCTS[product], t = p.tiers, i;
    for (i = 0; i < t.length; i++) {
      if (p.exclusive ? volume < t[i][0] : volume <= t[i][0]) break;
    }
    if (i >= t.length) i = t.length - 1;
    var next = i + 1 < t.length
      ? { plan: t[i + 1][1], rate: t[i + 1][2], from: p.exclusive ? t[i][0] : t[i][0] + 1 }
      : null;
    return { plan: t[i][1], rate: t[i][2], index: i, next: next };
  }

  function rate(product, volume) { return tier(product, volume).rate; }

  // Full monthly model. Volumes of 0 switch a product off.
  //   in: { chats, autom, qa, tickets, psp, mins, chatCost, qaManual, ticketCost, voiceCost, payShare, chatOn }
  //   chatOn: false leaves the AI Chat Operator out while `chats` still sets the QA volume.
  function model(i) {
    var c = +i.chats || 0, t = +i.tickets || 0, m = +i.mins || 0;
    var chatOn = i.chatOn !== false && c > 0;
    var a = (i.autom != null ? +i.autom : DEFAULTS.autom) / 100;
    var ps = (i.payShare != null ? +i.payShare : DEFAULTS.payShare) / 100;
    var qa = !!i.qa && c > 0;
    var psp = Math.max(1, Math.round(+i.psp || 1));
    var hc = i.chatCost != null ? +i.chatCost : BASELINE.chat;
    var hq = i.qaManual != null ? +i.qaManual : BASELINE.qaManual;
    var ht = i.ticketCost != null ? +i.ticketCost : BASELINE.ticket;
    var hv = i.voiceCost != null ? +i.voiceCost : BASELINE.voiceMin;

    var cr = rate('chat', c), qr = rate('qa', c), pr = rate('payment', t), vr = rate('voice', m);

    var chatWith = chatOn ? c * a * cr + c * (1 - a) * hc : 0, chatWithout = chatOn ? c * hc : 0;
    var qaWith = qa ? c * qr : 0, qaWithout = qa ? c * hq : 0;
    var payWith = t * ps * pr + t * (1 - ps) * ht, payWithout = t * ht;
    var voiceWith = m * vr, voiceWithout = m * hv;

    var without = chatWithout + qaWithout + payWithout + voiceWithout;
    var withAi = chatWith + qaWith + payWith + voiceWith;
    var setup = (chatOn ? PRODUCTS.chat.setup : 0) + (qa ? PRODUCTS.qa.setup : 0)
      + (t > 0 ? PRODUCTS.payment.setup * psp : 0) + (m > 0 ? PRODUCTS.voice.setup : 0);

    return {
      cr: cr, qr: qr, pr: pr, vr: vr,
      chatWith: chatWith, chatWithout: chatWithout,
      qaWith: qaWith, qaWithout: qaWithout,
      payWith: payWith, payWithout: payWithout,
      voiceWith: voiceWith, voiceWithout: voiceWithout,
      without: without, withAi: withAi, setup: setup, save: without - withAi
    };
  }

  // Plan name shown in the homepage chips — driven by chat volume.
  function planFor(chats) { return tier('chat', chats).plan; }

  return { PRODUCTS: PRODUCTS, BASELINE: BASELINE, DEFAULTS: DEFAULTS, tier: tier, rate: rate, model: model, planFor: planFor };
})();
