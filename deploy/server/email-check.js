'use strict';

/**
 * QODEQ — проверка email из формы заявки, пока человек ещё на странице.
 *
 *   1. Своими силами: одноразовые домены и DNS (принимает ли домен почту вообще).
 *   2. ZeroBounce (если задан ZEROBOUNCE_API_KEY): существует ли сам ящик.
 *
 * Отклоняем только то, что точно не дойдёт. Любая неясность — сбой DNS,
 * таймаут, кончились кредиты, catch-all у компании — заявку пропускает:
 * проверка не должна стоить нам живого клиента.
 */

const dns = require('dns').promises;

// Самые частые одноразовые почты (полный список — десятки тысяч доменов,
// остальное ловит ZeroBounce со статусом disposable)
const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'sharklasers.com',
  'grr.la', '10minutemail.com', '10minutemail.net', 'temp-mail.org', 'temp-mail.io', 'tempmail.com',
  'tempmail.net', 'tempmail.dev', 'tempmailo.com', 'tmpmail.org', 'tmpmail.net', 'yopmail.com',
  'yopmail.fr', 'yopmail.net', 'trashmail.com', 'trashmail.de', 'getnada.com', 'nada.email',
  'dispostable.com', 'maildrop.cc', 'mailnesia.com', 'mintemail.com', 'throwawaymail.com',
  'fakeinbox.com', 'mohmal.com', 'emailondeck.com', 'mailcatch.com', 'spamgourmet.com',
  'mytemp.email', 'tempr.email', 'discard.email', 'burnermail.io', 'inboxkitten.com',
  'moakt.com', 'tempinbox.com', 'emailfake.com', 'mail.tm', 'mailpoof.com', 'crazymailing.com',
  'dropmail.me', '1secmail.com', '1secmail.net', '1secmail.org', 'harakirimail.com', 'mailforspam.com',
  'cryptogmail.com', 'linshiyouxiang.net', 'tempail.com', 'luxusmail.org', 'minuteinbox.com',
]);

const DNS_TIMEOUT_MS = 3000;
const ZB_TIMEOUT_MS = 6000;   // ZeroBounce сам сдаётся через ZB_SERVER_TIMEOUT_S и отвечает unknown
const ZB_SERVER_TIMEOUT_S = 4;
const CACHE_MS = 24 * 3600 * 1000;

// Ответы ZeroBounce, после которых письмо точно не дойдёт
const ZB_BAD = new Set(['mailbox_not_found', 'no_dns_entries', 'failed_syntax_check', 'possible_typo',
  'does_not_accept_mail', 'unroutable_ip_address']);

const MESSAGES = {
  en: {
    not_found: 'This email address doesn’t seem to exist. Please check it or leave your Telegram or phone instead.',
    disposable: 'Please use a permanent email address: our reply may not reach a temporary one.',
    suggest: (s) => `Did you mean ${s}?`,
  },
  ru: {
    not_found: 'Похоже, такого адреса не существует. Проверьте его или оставьте Telegram или телефон.',
    disposable: 'Укажите постоянный адрес: на временную почту наш ответ может не дойти.',
    suggest: (s) => `Возможно, вы имели в виду ${s}?`,
  },
};

function withTimeout(promise, ms) {
  let t;
  return Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), ms); })])
    .finally(() => clearTimeout(t));
}

/** 'bad' — домен почту не принимает, 'ok' — принимает, 'unknown' — DNS не ответил. */
async function domainAcceptsMail(domain) {
  try {
    const mx = await withTimeout(dns.resolveMx(domain), DNS_TIMEOUT_MS);
    // Null MX (RFC 7505): домен явно заявляет, что почту не принимает
    if (mx.length && mx.every((r) => !r.exchange || r.exchange === '.')) return 'bad';
    if (mx.length) return 'ok';
  } catch (err) {
    if (err.code === 'ENOTFOUND') return 'bad';          // домена нет
    if (err.code !== 'ENODATA') return 'unknown';       // таймаут, SERVFAIL и т. п.
  }
  // MX нет — по RFC 5321 почта идёт на A/AAAA самого домена
  try {
    const a = await withTimeout(dns.resolve(domain), DNS_TIMEOUT_MS);
    return a.length ? 'ok' : 'bad';
  } catch (err) {
    return err.code === 'ENODATA' || err.code === 'ENOTFOUND' ? 'bad' : 'unknown';
  }
}

function createEmailChecker(opts = {}) {
  const apiKey = (opts.zeroBounceKey || '').trim();
  const apiUrl = (opts.zeroBounceUrl || 'https://api-eu.zerobounce.net/v2/validate').trim();
  const log = opts.log || console;
  const cache = new Map();   // email → { at, result }

  async function zeroBounce(email) {
    const url = new URL(apiUrl);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('email', email);
    url.searchParams.set('timeout', String(ZB_SERVER_TIMEOUT_S));
    const r = await fetch(url, { signal: AbortSignal.timeout(ZB_TIMEOUT_MS) });
    const data = await r.json().catch(() => ({}));
    if (data.error || !data.status) throw new Error(data.error || 'HTTP ' + r.status);
    return data;
  }

  /**
   * { ok: true } или { ok: false, reason: 'not_found' | 'disposable', suggestion? }.
   * Вызывать только для строк, похожих на email.
   */
  async function check(email) {
    email = String(email || '').trim().toLowerCase();
    const hit = cache.get(email);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;

    const result = await (async () => {
      const domain = email.split('@').pop();
      if (DISPOSABLE.has(domain)) return { ok: false, reason: 'disposable' };
      if (await domainAcceptsMail(domain) === 'bad') return { ok: false, reason: 'not_found' };
      if (!apiKey) return { ok: true };

      try {
        const zb = await zeroBounce(email);
        const dym = String(zb.did_you_mean || '').trim().toLowerCase();
        const suggestion = dym && dym !== email ? dym : undefined;
        if (zb.status === 'invalid' && ZB_BAD.has(zb.sub_status)) return { ok: false, reason: 'not_found', suggestion, zb: zb.sub_status };
        if (zb.status === 'do_not_mail' && zb.sub_status === 'disposable') return { ok: false, reason: 'disposable', zb: zb.sub_status };
        return { ok: true, zb: `${zb.status}${zb.sub_status ? '/' + zb.sub_status : ''}` };
      } catch (err) {
        log.error('ZeroBounce:', err.message);
        return { ok: true, zb: 'error' };
      }
    })();

    // ошибку сервиса не кэшируем — следующая попытка спросит заново
    if (result.zb !== 'error') cache.set(email, { at: Date.now(), result });
    if (cache.size > 2000) cache.delete(cache.keys().next().value);
    return result;
  }

  /** Текст для формы на языке страницы. */
  function message(result, lang) {
    const t = MESSAGES[lang === 'ru' ? 'ru' : 'en'];
    const base = t[result.reason] || t.not_found;
    return result.suggestion ? `${base} ${t.suggest(result.suggestion)}` : base;
  }

  return { enabled: Boolean(apiKey), check, message };
}

module.exports = { createEmailChecker, domainAcceptsMail };
