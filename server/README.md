# QODEQ — сервер формы обратной связи

Принимает заявки из блока «Contact» на `QODEQ.dc.html` и отправляет их письмом
на `NOTIFY_EMAIL` через SMTP. Заодно отдаёт статику сайта.

## Запуск локально

```bash
cd server
npm install
npm start           # слушает http://localhost:3001
```

Открыть `http://localhost:3001/` — сайт отдаётся тем же сервером, форма шлёт
на `/api/lead` (тот же домен, CORS не нужен).

## Настройка

Все параметры — в `server/.env` (образец — `.env.example`):

| Переменная | Обязательна | Назначение |
|---|---|---|
| `NOTIFY_EMAIL` | да | Куда приходят заявки |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | да | SMTP провайдера. 587 → `SMTP_SECURE=false`, 465 → `true` |
| `SMTP_USER` / `SMTP_PASS` | да | Логин и пароль (для Gmail — **пароль приложения**, не обычный) |
| `SMTP_FROM` | нет | Поле «От кого». По умолчанию `QODEQ <SMTP_USER>` |
| `MAIL_SUBJECT_PREFIX` | нет | Префикс темы письма |
| `PORT` | нет | Порт сервера (за nginx). По умолчанию 3001 |
| `SITE_DIR` | нет | Папка статики. По умолчанию — родительская |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | нет | Дублировать заявки в Telegram |
| `AUTOREPLY` | нет | `true` — слать автоответ клиенту на email |

При старте сервер проверяет SMTP и пишет `SMTP OK ...` либо ошибку.

## Gmail

Пароль приложения выдаётся только при включённой двухэтапной аутентификации:
Google Account → Security → 2-Step Verification → App passwords.
16 символов, вставлять без пробелов. Обычный пароль от почты Gmail по SMTP не принимает
(ошибка `535-5.7.8 Username and Password not accepted`).

Для Google Workspace (`@softqod.com`) администратор дополнительно должен разрешить
«SMTP AUTH» для пользователя в консоли администратора.

## Деплой на qodeq.net

1. Скопировать проект на сервер, положить рабочий `server/.env`.
2. `cd server && npm ci && npm start` под менеджером процессов (pm2 / systemd).
3. nginx проксирует `qodeq.net` → `http://127.0.0.1:3001` (или только `/api/` на Node,
   а статику отдавать напрямую nginx — тогда задать `SITE_DIR`).
4. Удалить `asd.txt` из корня (сервер его не отдаёт, но файлу там не место).

## Проверка

```bash
curl -X POST http://localhost:3001/api/lead \
  -H 'Content-Type: application/json' \
  -d '{"name":"Тест","company":"ACME","contact":"test@example.com","calc":{"chatsPerMonth":250000,"automationPct":65}}'
# {"ok":true}
```
