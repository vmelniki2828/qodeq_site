# Деплой нового сайта QODEQ на qodeq.net

Сервер: `root@209.38.193.199`, проект в `/home/qodeq_main`.

Сейчас там крутится **старая** версия сайта (React, собирается в Docker, отдаётся
из volume `qodeq_front`) + отдельный контейнер `qodeq-contact-api` с формой на
`/api/contact-leads`. Новый сайт — чистая статика (без сборки), форма шлёт на
`/api/lead`.

Всё ниже выполняется **на твоей машине** (команды из этой папки `deploy/`),
кроме шагов с пометкой «на сервере».

## Что заменяется, а что — нет

| Остаётся как есть | Заменяется |
|---|---|
| `server/.env` (там уже реальные SMTP-креды) | `server/index.js` → новый, добавляет `/api/lead`, старый `/api/contact-leads` оставлен для совместимости |
| `server/Dockerfile`, `server/package.json` | `docker-compose.yml` → убран сервис `react-build` (он больше не нужен), volume `qodeq_front` заменён на bind-mount папки `./public` |
| `nginx/nginx.conf`, `nginx/certs/*` | `public/` → полностью новое содержимое (наши `.dc.html`) |
| Домены `demo-voice.qodeq.net`, `redoc.qodeq.net` (другие volume, не трогаем) | старый `Dockerfile`, `package.json`, `src/` в корне — больше не используются сборкой, но можно не удалять |

## 0. Бэкап (обязательно)

```bash
ssh root@209.38.193.199 '
  cd /home/qodeq_main &&
  tar czf /root/qodeq_main-backup-$(date +%Y%m%d-%H%M).tar.gz \
    --exclude=node_modules --exclude=.git .
'
```

Это разворачиваемый бэкап всего текущего проекта на сервере (лежит в `/root`).
Если что-то пойдёт не так — можно вернуть.

## 1. Залить файлы

Из этой папки (`site/deploy`):

```bash
# новая статика — на замену старой public/
scp -r public root@209.38.193.199:/home/qodeq_main/public_new

# новый API-сервер
scp server/index.js root@209.38.193.199:/home/qodeq_main/server/index.new.js

# новый docker-compose.yml
scp docker-compose.yml root@209.38.193.199:/home/qodeq_main/docker-compose.new.yml
```

Специально залито «рядом» (`public_new`, `index.new.js`, `docker-compose.new.yml`),
а не поверх старых файлов — так на сервере можно спокойно сверить и подменить
одной командой, не потеряв текущее состояние на середине.

## 2. Подменить файлы (на сервере)

```bash
ssh root@209.38.193.199
cd /home/qodeq_main

rm -rf public && mv public_new public
mv server/index.new.js server/index.js
mv docker-compose.new.yml docker-compose.yml
```

## 3. Пересобрать и перезапустить

```bash
docker compose down --remove-orphans
docker compose up -d --build
docker compose ps
```

`--remove-orphans` уберёт контейнер `react-build`, которого больше нет в
`docker-compose.yml`.

## 4. Проверить

```bash
curl -s https://qodeq.net/api/health
# {"ok":true}

curl -s -o /dev/null -w '%{http_code}\n' https://qodeq.net/
# 200

docker compose logs contact-api --tail=30
# ищи "SMTP OK — ..." — значит форма реально сможет отправлять письма
```

Дальше открой https://qodeq.net в браузере руками:
- главная страница, переходы по продуктам, калькулятор;
- отправь тестовую заявку через форму Contact и проверь, что письмо дошло
  на адрес из `NOTIFY_EMAIL`.

## Откат, если что-то не так

```bash
ssh root@209.38.193.199
cd /home/qodeq_main
docker compose down
tar xzf /root/qodeq_main-backup-*.tar.gz -C /home/qodeq_main
docker compose up -d --build
```

## Заметки

- `server/.env` не трогается вообще — новый `index.js` использует те же
  переменные (`NOTIFY_EMAIL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` и т.д.),
  что и старый.
- Домены `demo-voice.qodeq.net` и `redoc.qodeq.net` берут статику из
  `/home/shared` — это вне `docker-compose.yml` этого проекта, никак не
  задеты.
- Старые `Dockerfile` / `package.json` / `package-lock.json` / `src/` в корне
  `/home/qodeq_main` (сборка старого React-сайта) после переключения не
  используются никаким сервисом в `docker-compose.yml` — их можно оставить
  как есть или позже удалить, когда убедишься, что новый сайт стабильно
  работает.
