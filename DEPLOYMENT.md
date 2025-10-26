# 🚀 Инструкция по развертыванию на oris-appointment.ru

## 📋 Предварительные требования

- Сервер с Ubuntu/Debian (IP: 176.114.89.148)
- SSH доступ к серверу
- Домен oris-appointment.ru уже настроен в DNS (A-запись указывает на 176.114.89.148)
- Root или sudo доступ

## 🔧 Шаг 1: Подготовка сервера

```bash
# Подключитесь к серверу
ssh root@176.114.89.148

# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите необходимые пакеты
sudo apt install -y nginx certbot python3-certbot-nginx nodejs npm postgresql git

# Установите Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## 📁 Шаг 2: Загрузка проекта на сервер

```bash
# Создайте директорию для проекта
sudo mkdir -p /var/www/oris-appointment
cd /var/www/oris-appointment

# Клонируйте репозиторий
sudo git clone https://github.com/mashka818/ORIS.git .

# Установите зависимости
sudo npm install

# Установите PM2 для управления Node.js процессом
sudo npm install -g pm2
```

## 🗄️ Шаг 3: Настройка PostgreSQL

```bash
# Переключитесь на пользователя postgres
sudo -u postgres psql

# В psql выполните:
CREATE DATABASE temp;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE temp TO your_user;
\q
```

Создайте файл `.env` в корне проекта:

```bash
sudo nano /var/www/oris-appointment/.env
```

Добавьте:
```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=temp
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_min_32_chars_long
```

## 🌐 Шаг 4: Настройка Nginx

```bash
# Скопируйте конфигурацию nginx
sudo cp /var/www/oris-appointment/nginx/oris-appointment.conf /etc/nginx/sites-available/

# Создайте символическую ссылку
sudo ln -s /etc/nginx/sites-available/oris-appointment.conf /etc/nginx/sites-enabled/

# Удалите дефолтную конфигурацию (если есть)
sudo rm /etc/nginx/sites-enabled/default

# Проверьте конфигурацию nginx
sudo nginx -t

# Перезапустите nginx
sudo systemctl restart nginx
```

## 🔒 Шаг 5: Получение SSL сертификата

```bash
# Создайте директорию для certbot
sudo mkdir -p /var/www/certbot

# Получите SSL сертификат через certbot
sudo certbot --nginx -d oris-appointment.ru -d www.oris-appointment.ru

# Следуйте инструкциям:
# 1. Введите email
# 2. Согласитесь с Terms of Service (Y)
# 3. Выберите опцию 2 (Redirect) для автоматического редиректа HTTP -> HTTPS

# Проверьте автообновление сертификата
sudo certbot renew --dry-run
```

## 🚀 Шаг 6: Запуск приложения

```bash
# Перейдите в директорию проекта
cd /var/www/oris-appointment

# Запустите бэкенд через PM2
pm2 start npm --name "oris-backend" -- start

# Сохраните конфигурацию PM2
pm2 save

# Настройте автозапуск при перезагрузке
pm2 startup systemd
# Выполните команду, которую выдаст PM2

# Проверьте статус
pm2 status
pm2 logs oris-backend
```

## ✅ Шаг 7: Проверка работы

1. Откройте в браузере: https://oris-appointment.ru
2. Проверьте, что:
   - ✅ Открывается главная страница (фронтенд)
   - ✅ Работает выбор даты и клиники
   - ✅ API запросы проходят успешно (проверьте в DevTools -> Network)
   - ✅ Работает запись на прием
   - ✅ Работает админ-панель (https://oris-appointment.ru/admin)

## 🔄 Обновление проекта

```bash
# Подключитесь к серверу
ssh root@176.114.89.148

# Перейдите в директорию проекта
cd /var/www/oris-appointment

# Получите последние изменения
sudo git pull origin main

# Установите новые зависимости (если есть)
sudo npm install

# Перезапустите бэкенд
pm2 restart oris-backend

# Перезагрузите nginx (если изменились статические файлы)
sudo systemctl reload nginx
```

## 📊 Мониторинг и логи

```bash
# Логи бэкенда
pm2 logs oris-backend

# Логи Nginx
sudo tail -f /var/log/nginx/oris-appointment-access.log
sudo tail -f /var/log/nginx/oris-appointment-error.log

# Статус сервисов
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

## 🔧 Решение проблем

### Проблема: "502 Bad Gateway"
```bash
# Проверьте, запущен ли бэкенд
pm2 status

# Проверьте логи
pm2 logs oris-backend

# Перезапустите бэкенд
pm2 restart oris-backend
```

### Проблема: "Connection refused" для PostgreSQL
```bash
# Проверьте статус PostgreSQL
sudo systemctl status postgresql

# Запустите PostgreSQL
sudo systemctl start postgresql

# Проверьте подключение
sudo -u postgres psql -c "SELECT version();"
```

### Проблема: SSL сертификат не работает
```bash
# Проверьте срок действия сертификата
sudo certbot certificates

# Обновите сертификат вручную
sudo certbot renew --force-renewal

# Перезапустите nginx
sudo systemctl restart nginx
```

## 🔐 Безопасность

1. **Настройте firewall:**
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

2. **Настройте fail2ban для защиты от брутфорса:**
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

3. **Регулярно обновляйте систему:**
```bash
sudo apt update && sudo apt upgrade -y
```

## 📞 Контакты

При возникновении проблем проверьте:
- GitHub: https://github.com/mashka818/ORIS
- Логи сервера: `/var/log/nginx/` и `pm2 logs`

---

**Готово! 🎉** Ваше приложение теперь доступно по адресу: https://oris-appointment.ru

