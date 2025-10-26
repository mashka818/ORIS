#!/bin/bash

# 🚀 Автоматический скрипт настройки сервера для oris-appointment.ru
# Выполните этот скрипт на СВЕЖЕМ сервере Ubuntu/Debian
# 
# Использование:
# 1. Скопируйте этот файл на сервер: scp setup-server.sh root@176.114.89.148:~/
# 2. Подключитесь к серверу: ssh root@176.114.89.148
# 3. Запустите: bash setup-server.sh

set -e  # Остановка при ошибке

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   🚀 ORIS Booking System - Server Setup   ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Конфигурация
DOMAIN="oris-appointment.ru"
APP_DIR="/var/www/oris-appointment"
REPO_URL="https://github.com/mashka818/ORIS.git"
DB_NAME="temp"
DB_USER="oris_user"

# Генерация случайных паролей
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
ADMIN_PASSWORD=$(openssl rand -base64 20 | tr -d "=+/" | cut -c1-16)
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/")

echo -e "${YELLOW}📋 Конфигурация:${NC}"
echo "   Domain: $DOMAIN"
echo "   App directory: $APP_DIR"
echo "   Database name: $DB_NAME"
echo "   Database user: $DB_USER"
echo ""

# ============================================================================
# Шаг 1: Обновление системы
# ============================================================================
echo -e "${GREEN}[1/9] 📦 Обновление системы...${NC}"
apt update && apt upgrade -y

# ============================================================================
# Шаг 2: Установка базовых пакетов
# ============================================================================
echo -e "${GREEN}[2/9] 🔧 Установка базовых пакетов...${NC}"
apt install -y curl wget git build-essential software-properties-common ufw

# ============================================================================
# Шаг 3: Установка Node.js 18
# ============================================================================
echo -e "${GREEN}[3/9] 📦 Установка Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node --version
npm --version

# ============================================================================
# Шаг 4: Установка PostgreSQL
# ============================================================================
echo -e "${GREEN}[4/9] 🗄️  Установка PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

# Запуск PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Создание базы данных и пользователя
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
\q
EOF

echo -e "${GREEN}✓ PostgreSQL настроен${NC}"

# ============================================================================
# Шаг 5: Установка Nginx
# ============================================================================
echo -e "${GREEN}[5/9] 🌐 Установка Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# ============================================================================
# Шаг 6: Установка Certbot для SSL
# ============================================================================
echo -e "${GREEN}[6/9] 🔒 Установка Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

# Создание директории для certbot
mkdir -p /var/www/certbot

# ============================================================================
# Шаг 7: Клонирование проекта
# ============================================================================
echo -e "${GREEN}[7/9] 📥 Клонирование проекта...${NC}"
mkdir -p $APP_DIR
git clone $REPO_URL $APP_DIR
cd $APP_DIR

# Установка зависимостей
npm install --production

# Установка PM2 глобально
npm install -g pm2

# ============================================================================
# Шаг 8: Создание .env файла
# ============================================================================
echo -e "${GREEN}[8/9] ⚙️  Создание конфигурации...${NC}"
cat > $APP_DIR/.env << EOF
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Server Configuration
PORT=3000
NODE_ENV=production

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$ADMIN_PASSWORD

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Domain
DOMAIN=$DOMAIN
EOF

chmod 600 $APP_DIR/.env

# ============================================================================
# Шаг 9: Настройка Nginx
# ============================================================================
echo -e "${GREEN}[9/9] 🔧 Настройка Nginx...${NC}"

# Копирование конфигурации
cp $APP_DIR/nginx/oris-appointment.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/oris-appointment.conf /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации (может упасть, так как SSL сертификаты еще не созданы)
echo -e "${YELLOW}⚠️  Временно отключаем SSL в nginx для получения сертификата...${NC}"

# Создаем временную конфигурацию только для HTTP (для certbot)
cat > /etc/nginx/sites-available/oris-appointment-temp.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name oris-appointment.ru www.oris-appointment.ru;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        root /var/www/oris-appointment/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Активируем временную конфигурацию
ln -sf /etc/nginx/sites-available/oris-appointment-temp.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/oris-appointment.conf

# Перезапуск Nginx
nginx -t && systemctl restart nginx

# ============================================================================
# Запуск приложения
# ============================================================================
echo -e "${GREEN}🚀 Запуск приложения...${NC}"
cd $APP_DIR
pm2 start npm --name "oris-backend" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# ============================================================================
# Настройка Firewall
# ============================================================================
echo -e "${GREEN}🔥 Настройка firewall...${NC}"
ufw --force enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw status

# ============================================================================
# Получение SSL сертификата
# ============================================================================
echo -e "${GREEN}🔒 Получение SSL сертификата...${NC}"
echo -e "${YELLOW}⚠️  ВАЖНО: Убедитесь, что DNS записи для $DOMAIN уже настроены!${NC}"
echo -e "${YELLOW}   A-запись: @ -> 176.114.89.148${NC}"
echo -e "${YELLOW}   A-запись: www -> 176.114.89.148${NC}"
echo ""
read -p "DNS настроен? Нажмите Enter для продолжения или Ctrl+C для отмены..."

certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --register-unsafely-without-email || {
    echo -e "${YELLOW}⚠️  Не удалось получить SSL сертификат автоматически${NC}"
    echo -e "${YELLOW}   Выполните вручную: certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
}

# Активируем полную конфигурацию с SSL
rm -f /etc/nginx/sites-enabled/oris-appointment-temp.conf
ln -sf /etc/nginx/sites-available/oris-appointment.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# ============================================================================
# Завершение
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ Установка завершена успешно!   ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🌐 Ваше приложение доступно по адресу:${NC}"
echo -e "   ${BLUE}https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}📝 Сохраните эти данные в безопасном месте:${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Database:${NC}"
echo "  Host: 127.0.0.1"
echo "  Port: 5432"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo -e "${GREEN}Admin Panel:${NC}"
echo "  URL: https://$DOMAIN"
echo "  Username: admin"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo -e "${GREEN}JWT Secret:${NC}"
echo "  $JWT_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📋 Полезные команды:${NC}"
echo "  pm2 status                - Статус приложения"
echo "  pm2 logs oris-backend     - Логи приложения"
echo "  pm2 restart oris-backend  - Перезапуск приложения"
echo "  systemctl status nginx    - Статус Nginx"
echo "  certbot certificates      - Проверка SSL сертификатов"
echo ""
echo -e "${GREEN}✅ Готово! Откройте https://$DOMAIN в браузере${NC}"
echo ""

# Сохранение учетных данных в файл
cat > /root/oris-credentials.txt << EOF
ORIS Booking System - Credentials
Generated: $(date)

Domain: https://$DOMAIN

Database:
  Host: 127.0.0.1
  Port: 5432
  Name: $DB_NAME
  User: $DB_USER
  Password: $DB_PASSWORD

Admin Panel:
  URL: https://$DOMAIN
  Username: admin
  Password: $ADMIN_PASSWORD

JWT Secret: $JWT_SECRET

.env file location: $APP_DIR/.env
EOF

chmod 600 /root/oris-credentials.txt

echo -e "${GREEN}💾 Учетные данные сохранены в: /root/oris-credentials.txt${NC}"

