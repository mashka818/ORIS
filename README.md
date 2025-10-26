Онлайн‑запись — фронт + бек

## Быстрый запуск с Docker

1) Скопируйте `.env.example` в `.env` и при необходимости измените значения
2) `docker-compose up -d`
2) Откройте http://localhost:3000

## Локальная разработка

Требования:
- Node 18+
- Postgres (user: postgres, pass: 010406, db: temp)

Установка:
1) `npm i`
2) `npm run start`
3) Откройте http://localhost:3000

## Docker команды

- `npm run docker:build` — собрать образы
- `npm run docker:up` — запустить в фоне
- `npm run docker:down` — остановить
- `npm run docker:logs` — посмотреть логи

## Доступ администратора

- Логин: admin
- Пароль: Davidovich2025

## Функционал

- Календарь (09:00–18:30), слоты каждые 30 минут
- Вместимость: 6 записей на слот; при заполнении — выделение красным
- Бронирование: имя, телефон
- Админ: вход, список, отмена записи
- RU/EN, светлая/темная тема, адаптивно

## Стек

- backend: Express + TypeORM + Postgres
- frontend: статические файлы, Vanilla JS

## Переменные окружения

- PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, ADMIN_PASSWORD, JWT_SECRET

## 🌐 Production деплой на oris-appointment.ru

### Быстрый деплой через скрипт:
```bash
bash deploy.sh
```

### Ручной деплой:
См. подробную инструкцию в [DEPLOYMENT.md](./DEPLOYMENT.md)

### Архитектура на сервере:
- **Домен**: oris-appointment.ru (HTTPS)
- **Фронтенд**: Nginx отдает статические файлы из `/var/www/oris-appointment/frontend`
- **Бэкенд**: Node.js (Express) на порту 3000, управляется через PM2
- **База данных**: PostgreSQL на localhost
- **SSL**: Let's Encrypt сертификат (автообновление через certbot)
- **Проксирование**: Nginx проксирует `/api/*` запросы на `localhost:3000`

### Обновление на production:
```bash
# На сервере
cd /var/www/oris-appointment
git pull origin main
npm install
pm2 restart oris-backend
systemctl reload nginx
```

