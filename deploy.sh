#!/bin/bash

# 🚀 Скрипт для деплоя ORIS Booking System на сервер
# Использование: bash deploy.sh

set -e

echo "🚀 Starting deployment to oris-appointment.ru..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Конфигурация
SERVER_IP="176.114.89.148"
SERVER_USER="root"
DOMAIN="oris-appointment.ru"
APP_DIR="/var/www/oris-appointment"
REPO_URL="https://github.com/mashka818/ORIS.git"

echo -e "${YELLOW}📡 Connecting to server...${NC}"

# Команды для выполнения на сервере
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

# Переменные
APP_DIR="/var/www/oris-appointment"
DOMAIN="oris-appointment.ru"

echo "📁 Navigating to application directory..."
cd $APP_DIR

echo "⬇️  Pulling latest changes from Git..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production

echo "🔄 Restarting backend with PM2..."
pm2 restart oris-backend || pm2 start npm --name "oris-backend" -- start

echo "♻️  Reloading Nginx..."
systemctl reload nginx

echo "✅ Checking services status..."
pm2 status
systemctl status nginx --no-pager

echo "📊 Showing recent logs..."
pm2 logs oris-backend --lines 20 --nostream

ENDSSH

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is live at: https://${DOMAIN}${NC}"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs oris-backend'"
echo "  - Check status: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
echo "  - Restart app: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 restart oris-backend'"

