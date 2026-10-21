FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
# better-sqlite3 — нативный модуль: обычно скачивается готовая сборка под musl,
# а если её нет — собирается из исходников, для этого временно ставим компилятор.
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
 && npm ci --omit=dev \
 && apk del .build-deps

COPY . .

EXPOSE 3001
CMD ["node", "index.js"]
