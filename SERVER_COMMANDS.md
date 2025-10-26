# 📝 Шпаргалка команд для сервера oris-appointment.ru

## 🔐 Подключение к серверу
```bash
ssh root@176.114.89.148
```

## 📁 Директории проекта
```bash
cd /var/www/oris-appointment          # Корень проекта
cd /var/www/oris-appointment/frontend # Фронтенд
cd /var/www/oris-appointment/backend  # Бэкенд
```

## 🔄 Обновление приложения
```bash
# Перейти в директорию
cd /var/www/oris-appointment

# Скачать изменения с GitHub
git pull origin main

# Установить зависимости
npm install

# Перезапустить бэкенд
pm2 restart oris-backend

# Перезагрузить Nginx
systemctl reload nginx
```

## 📊 Мониторинг PM2 (Node.js)
```bash
pm2 status                    # Статус всех процессов
pm2 logs oris-backend         # Просмотр логов в реальном времени
pm2 logs oris-backend --lines 50  # Последние 50 строк логов
pm2 restart oris-backend      # Перезапуск приложения
pm2 stop oris-backend         # Остановить приложение
pm2 start oris-backend        # Запустить приложение
pm2 delete oris-backend       # Удалить процесс из PM2
pm2 monit                     # Интерактивный мониторинг
```

## 🌐 Управление Nginx
```bash
# Проверка конфигурации
nginx -t

# Перезагрузка (без простоя)
systemctl reload nginx

# Полный перезапуск
systemctl restart nginx

# Статус
systemctl status nginx

# Просмотр логов
tail -f /var/log/nginx/oris-appointment-access.log
tail -f /var/log/nginx/oris-appointment-error.log
```

## 🗄️ PostgreSQL
```bash
# Подключение к БД
sudo -u postgres psql -d temp

# Внутри psql:
\dt                           # Список таблиц
\d bookings                   # Структура таблицы bookings
\d clinics                    # Структура таблицы clinics
SELECT * FROM bookings LIMIT 10;  # Первые 10 записей
SELECT * FROM clinics;        # Список клиник
\q                           # Выход

# Бэкап базы данных
sudo -u postgres pg_dump temp > /tmp/backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
sudo -u postgres psql temp < /tmp/backup_20250101.sql
```

## 🔒 SSL Сертификаты (Let's Encrypt)
```bash
# Проверка статуса сертификатов
certbot certificates

# Обновление сертификатов
certbot renew

# Принудительное обновление
certbot renew --force-renewal

# Тестовый запуск обновления (без изменений)
certbot renew --dry-run
```

## 🔥 Firewall (UFW)
```bash
ufw status                    # Статус firewall
ufw allow 80/tcp              # Открыть порт 80 (HTTP)
ufw allow 443/tcp             # Открыть порт 443 (HTTPS)
ufw allow 22/tcp              # Открыть порт 22 (SSH)
ufw enable                    # Включить firewall
ufw disable                   # Выключить firewall
```

## 🔍 Диагностика проблем

### Проблема: 502 Bad Gateway
```bash
# Проверить, запущен ли бэкенд
pm2 status

# Посмотреть логи бэкенда
pm2 logs oris-backend --lines 100

# Перезапустить бэкенд
pm2 restart oris-backend

# Проверить, слушает ли порт 3000
netstat -tulpn | grep 3000
```

### Проблема: База данных недоступна
```bash
# Проверить статус PostgreSQL
systemctl status postgresql

# Запустить PostgreSQL
systemctl start postgresql

# Проверить подключение
sudo -u postgres psql -c "SELECT version();"

# Проверить логи PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log
```

### Проблема: Nginx не запускается
```bash
# Проверить синтаксис конфигурации
nginx -t

# Посмотреть детали ошибки
systemctl status nginx
journalctl -xe -u nginx

# Проверить, не занят ли порт 80/443
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

### Проблема: Медленная работа
```bash
# Использование CPU и памяти
top
htop  # (если установлен)

# Использование диска
df -h

# PM2 мониторинг
pm2 monit

# Nginx статистика
tail -100 /var/log/nginx/oris-appointment-access.log | awk '{print $9}' | sort | uniq -c | sort -rn
```

## 🧹 Очистка логов
```bash
# Очистить логи PM2
pm2 flush

# Ротация логов Nginx
logrotate -f /etc/logrotate.d/nginx

# Очистка старых логов (старше 30 дней)
find /var/log/nginx/ -type f -name "*.log.*" -mtime +30 -delete
```

## 📦 Обновление системы
```bash
# Обновить список пакетов
apt update

# Обновить все пакеты
apt upgrade -y

# Обновить Node.js до LTS версии
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Проверить версии
node --version
npm --version
```

## 🚨 Экстренное восстановление

### Восстановить из Git
```bash
cd /var/www/oris-appointment
git reset --hard origin/main
npm install
pm2 restart oris-backend
```

### Откатить последний коммит
```bash
cd /var/www/oris-appointment
git log --oneline  # Посмотреть историю
git reset --hard HEAD~1  # Откатить на 1 коммит назад
npm install
pm2 restart oris-backend
```

### Перезапустить все сервисы
```bash
pm2 restart all
systemctl restart nginx
systemctl restart postgresql
```

## 📞 Полезные команды для дебага
```bash
# Проверить все активные соединения
netstat -tulpn

# Процессы, использующие много ресурсов
ps aux --sort=-%mem | head -10  # По памяти
ps aux --sort=-%cpu | head -10  # По CPU

# Размер директорий
du -sh /var/www/oris-appointment/*
du -sh /var/log/*

# Системная информация
uname -a              # Версия ядра
lsb_release -a        # Версия ОС
free -h               # Память
df -h                 # Диски
```

---

**💡 Совет**: Добавьте этот файл в закладки для быстрого доступа к командам!

