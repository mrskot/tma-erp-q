# НАЧАЛО РАБОТЫ С TMA-ERP-Q

## Обзор
Это руководство поможет вам настроить среду разработки и запустить проект TMA-ERP-Q локально. Проект представляет собой систему управления качеством с интеграцией Telegram и Bitrix24.

## Предварительные требования

### 1. Системные требования
- **Node.js:** версия 18.x или выше
- **npm:** версия 9.x или выше
- **PostgreSQL:** версия 14.x или выше
- **Git:** для контроля версий
- **Docker & Docker Compose** (опционально, но рекомендуется)

### 2. Учетные записи и доступы
- **Telegram Bot Token:** для работы с Telegram API
- **Bitrix24 Webhook URL** (опционально): для интеграции с CRM
- **S3-совместимое хранилище** (опционально): для хранения файлов

## Быстрый старт (Docker)

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd tma-erp-q
```

### 2. Настройка переменных окружения
```bash
cp .env.example .env
# Отредактируйте .env файл, указав свои настройки
```

### 3. Запуск через Docker Compose
```bash
docker-compose up -d
```

### 4. Проверка работы
```bash
# Проверка здоровья системы
curl http://localhost:3000/health

# Проверка базы данных
curl http://localhost:3000/health/db
```

## Ручная установка (без Docker)

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка базы данных PostgreSQL
```sql
-- Создание базы данных
CREATE DATABASE tma_erp_q;

-- Создание пользователя (опционально)
CREATE USER tma_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE tma_erp_q TO tma_user;
```

### 3. Настройка переменных окружения
Создайте файл `.env` со следующим содержимым:
```env
# Базовые настройки
NODE_ENV=development
PORT=3000

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tma_erp_q
DB_USER=tma_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook/telegram

# Bitrix24 (опционально)
BITRIX24_WEBHOOK_URL=https://your-company.bitrix24.ru/rest/1/your_webhook/
BITRIX24_ENABLED=false

# S3 хранилище (опционально)
S3_ENDPOINT=https://storage.yandexcloud.net
S3_BUCKET=tma-erp-q-files
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_REGION=ru-central1

# Настройки приложения
REQUIRE_PHOTOS=true
DEFAULT_SLA_HOURS=24
```

### 4. Запуск миграций базы данных
```bash
# Создание таблиц
npm run db:migrate

# Заполнение тестовыми данными (опционально)
npm run db:seed
```

### 5. Запуск приложения
```bash
# Режим разработки (с hot reload)
npm run dev

# Или в production режиме
npm start
```

## Настройка Telegram бота

### 1. Создание бота через BotFather
1. Откройте Telegram и найдите @BotFather
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен

### 2. Настройка Webhook
```bash
# Установка webhook (автоматически при запуске в production)
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/webhook/telegram"}'
```

### 3. Тестирование бота
1. Найдите своего бота в Telegram
2. Отправьте команду `/start`
3. Проверьте ответ бота

## Настройка Bitrix24 (опционально)

### 1. Получение webhook URL
1. Войдите в ваш Bitrix24 аккаунт
2. Перейдите в раздел "Приложения" → "Вебхуки"
3. Создайте новый inbound webhook
4. Скопируйте полученный URL

### 2. Настройка в .env
```env
BITRIX24_WEBHOOK_URL=https://your-company.bitrix24.ru/rest/1/your_webhook/
BITRIX24_ENABLED=true
```

## Структура проекта

```
tma-erp-q/
├── src/
│   ├── config/         # Конфигурации
│   ├── controllers/    # Контроллеры
│   ├── middleware/     # Промежуточное ПО
│   ├── models/         # Модели данных
│   ├── routes/         # Маршруты API
│   ├── services/       # Бизнес-логика
│   └── utils/          # Вспомогательные функции
├── public/             # Статические файлы
├── migrations/         # Миграции БД
├── seeds/             # Сиды БД
└── tests/             # Тесты
```

## Первые шаги после установки

### 1. Создание администратора
```bash
# Через API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_id": "123456789",
    "username": "admin",
    "role": "admin",
    "full_name": "Администратор Системы"
  }'
```

### 2. Настройка справочников
1. Войдите в систему как администратор
2. Перейдите в админ-панель
3. Настройте:
   - Участки (Lots)
   - Типы изделий (Products)
   - Чек-листы
   - Пользователей и роли

### 3. Тестирование основных функций
1. Создайте тестовую заявку через Telegram
2. Проверьте назначение контролёру
3. Проведите контроль и зафиксируйте результаты
4. Создайте несоответствие и проверьте workflow

## Режимы работы

### 1. Development режим
```bash
npm run dev
```
- Hot reload при изменениях
- Подробные логи
- Fake Telegram Auth (без реального бота)

### 2. Production режим
```bash
npm start
```
- Оптимизированная производительность
- Минимальные логи
- Реальная интеграция с Telegram

### 3. Тестовый режим
```bash
npm test
```
- Запуск тестов
- Использование тестовой БД
- Mock внешних сервисов

## Устранение неполадок

### 1. Проблемы с базой данных
```bash
# Проверка подключения
psql -h localhost -U tma_user -d tma_erp_q

# Сброс миграций
npm run db:migrate:reset
```

### 2. Проблемы с Telegram
```bash
# Проверка токена
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe

# Удаление webhook
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook
```

### 3. Проблемы с запуском
```bash
# Проверка портов
netstat -tulpn | grep :3000

# Проверка логов
npm run dev 2>&1 | tee app.log
```

## Дополнительные ресурсы

### Документация
- [API Reference](./api-reference.md)
- [Developer Guide](./developer-guide.md)
- [Database Guide](./database-guide.md)

### Внешние ссылки
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Bitrix24 REST API](https://dev.1c-bitrix.ru/rest_help/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Получение помощи

### 1. Вопросы по установке
- Проверьте логи приложения
- Убедитесь, что все переменные окружения установлены
- Проверьте версии зависимостей

### 2. Вопросы по использованию
- Обратитесь к документации API
- Проверьте примеры использования
- Создайте issue в репозитории

### 3. Сообщение об ошибках
При сообщении об ошибке укажите:
1. Версию Node.js и npm
2. Операционную систему
3. Шаги для воспроизведения
4. Ожидаемое и фактическое поведение
5. Логи ошибок

---
*Это руководство обновляется по мере развития проекта. Последнее обновление: 18.01.2026*