# Как использовать Chatwoot API

## Три типа API в Chatwoot

- **Application API** — для работы с аккаунтом от имени агента (диалоги, контакты, сообщения, отчёты). Аутентификация через личный `access_token` (Profile Settings → внизу страницы). Работает и на облаке, и на self-hosted.
- **Client API** (он же Public API) — для своего чат-клиента: виджет на сайте, приложение, бот. Аутентификация через `inbox_identifier` + `contact_identifier` (без личного токена агента).
- **Platform API** — административный уровень (пользователи, аккаунты, роли). Только self-hosted, токен выдаётся через Platform App в Super Admin Console.

Полная спецификация: Postman-коллекции Chatwoot ([Application API](https://www.postman.com/chatwoot/chatwoot-apis/documentation/fu7fw8d/chatwoot-application-api-v1-0)).

---

## Application API — базовое использование

1. Получить токен: аватар (левый низ) → Profile Settings → внизу страницы Access Token.
2. Базовый URL:
   ```
   https://<ваш-домен-chatwoot>/api/v1/accounts/{account_id}/...
   ```
   Для облака — `app.chatwoot.com`. `account_id` виден в URL админки (`/app/accounts/{id}/...`).
3. Токен передаётся в заголовке `api_access_token` (не `Authorization: Bearer`):
   ```bash
   curl -X GET \
     "https://app.chatwoot.com/api/v1/accounts/12345/conversations" \
     -H "api_access_token: ВАШ_ТОКЕН"
   ```
4. Частые запросы:
   - Список диалогов: `GET /api/v1/accounts/{account_id}/conversations`
   - Отправить сообщение: `POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages`
   - Создать контакт: `POST /api/v1/accounts/{account_id}/contacts`
   - Список инбоксов: `GET /api/v1/accounts/{account_id}/inboxes`

---

## Client API (инбокс типа "API") — свой чат-клиент

Инбокс типа **API** нужен не для приёма сообщений из внешнего канала, а чтобы самостоятельно строить чат-клиент (виджет, приложение, бота), который через API создаёт контакты, диалоги и сообщения в Chatwoot. Если нужен готовый чат-виджет на сайте — проще подключить обычный Website-инбокс со скриптом `chatwootSDK`, а не API-инбокс.

### Что означают значения в настройках инбокса

- **Идентификатор входящего канала** (`inbox_identifier`) — публичный ID, вставляется прямо в URL запросов. Его не страшно "светить" на клиенте (в браузере/приложении).
- **Проверка личности пользователя** (HMAC-ключ) — секретный ключ. Используется **только на сервере**, чтобы подписывать идентификатор пользователя и доказывать Chatwoot, что это действительно тот пользователь, за которого он себя выдаёт. Если не проверять личность, кто угодно, зная email/ID клиента, мог бы читать его переписку.
- **Принудительная проверка личности пользователя** — если включить, Chatwoot будет отклонять запросы без корректной подписи (`identifier_hash`).

### Базовый URL

```
https://<ваш-домен-chatwoot>/public/api/v1/inboxes/{inbox_identifier}/...
```

### Шаг 1. Создать контакт

На сервере считаем `identifier_hash`:

```python
import hmac, hashlib

identifier = "user_123"           # внутренний ID вашего пользователя
hmac_key = "ВАШ_HMAC_КЛЮЧ"        # ключ "Проверка личности пользователя"
identifier_hash = hmac.new(
    hmac_key.encode(), identifier.encode(), hashlib.sha256
).hexdigest()
```

Запрос:

```bash
curl -X POST \
  "https://<домен>/public/api/v1/inboxes/{inbox_identifier}/contacts" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user_123",
    "identifier_hash": "РЕЗУЛЬТАТ_HMAC_ВЫШЕ",
    "name": "Иван",
    "email": "ivan@example.com"
  }'
```

В ответе приходят `source_id` (он же `contact_identifier`) и `pubsub_token` — сохраните их (сессия/куки/база), они нужны для всех следующих запросов от имени этого пользователя.

### Шаг 2. Создать диалог

```bash
curl -X POST \
  "https://<домен>/public/api/v1/inboxes/{inbox_identifier}/contacts/{source_id}/conversations" \
  -H "Content-Type: application/json"
```

В ответе — `id` диалога, тоже сохранить.

### Шаг 3. Отправить сообщение

```bash
curl -X POST \
  "https://<домен>/public/api/v1/inboxes/{inbox_identifier}/contacts/{source_id}/conversations/{conversation_id}/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Здравствуйте!",
    "message_type": "outgoing"
  }'
```

### Получение ответов агента

- Поллинг: `GET .../conversations/{conversation_id}/messages`
- Реальное время: подписка на WebSocket через `pubsub_token`, полученный при создании контакта.

### Важно про безопасность

HMAC-ключ должен вычисляться **только на бэкенде**, никогда в коде, который выполняется в браузере — иначе теряется смысл проверки личности.

---

## Источники

- [Chatwoot APIs — Developer Docs](https://developers.chatwoot.com/contributing-guide/chatwoot-apis)
- [Как найти личный Access Token](https://www.chatwoot.com/hc/user-guide/articles/1757445004-how-to-find-your-personal-access-token-in-chatwoot)
- [Как создать API-инбокс](https://www.chatwoot.com/hc/user-guide/articles/1677839703-how-to-create-an-api-channel-inbox)
- [Create a contact — Developer Docs](https://developers.chatwoot.com/api-reference/contacts-api/create-a-contact)
- [Public API — Customer Interactions (DeepWiki)](https://deepwiki.com/chatwoot/chatwoot/4.4-public-api-customer-interactions)
