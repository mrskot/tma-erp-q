FROM node:18.20.8-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Если нужен sudo без пароля, делаем ЭТО ДО смены пользователя
RUN apk add --no-cache sudo && \
    echo 'node ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Создаем non-root пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Меняем владельца файлов
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["npm", "start"]