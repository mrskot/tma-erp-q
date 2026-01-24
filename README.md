# TMA-ERP-Q

Telegram Mini App ERP для управления качеством на производстве.

## Описание

TMA-ERP-Q — это система для цифровизации процессов приёмки Отдела Технического Контроля (ОТК) и управления несоответствиями на производстве. Система заменяет бумажный документооборот, обеспечивает скорость, прозрачность и чёткое распределение ответственности за дефекты.

## Основные функции

- Управление участками (Lots) производства
- Каталог типов изделий (Products) с чек-листами
- Заявки на приёмку (Applications) с фото МКИ
- Управление несоответствиями (Discrepancies)
- Интеграция с Telegram для мобильного доступа
- Синхронизация с Bitrix24 (опционально)
- Система отчетности и аналитики

## Технологический стек

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **ORM:** Knex.js
- **File Storage:** S3/MinIO
- **Authentication:** JWT + Telegram WebApp
- **Frontend:** Telegram Mini App + Vanilla JS

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd tma-erp-q
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка окружения

```bash
cp .env.example .env
# Отредактируйте .env файл при необходимости
```

### 4. Запуск Docker-контейнеров (разработка)

```bash
npm run docker:dev
```

Эта команда запустит:
- PostgreSQL на порту 5433
- MinIO (S3-совместимое хранилище) на портах 9000 и 9001

### 5. Применение миграций базы данных

```bash
npm run migrate:latest
```

### 6. Заполнение тестовыми данными

```bash
npm run seed:run
```

### 7. Запуск сервера разработки

```bash
npm run dev
```

Сервер будет доступен по адресу: http://localhost:3000

## Доступные скрипты

- `npm start` - Запуск в production режиме
- `npm run dev` - Запуск в development режиме с hot-reload
- `npm run docker:dev` - Запуск Docker-контейнеров для разработки
- `npm run docker:dev:down` - Остановка Docker-контейнеров
- `npm run docker:dev:logs` - Просмотр логов Docker-контейнеров
- `npm run migrate:latest` - Применение последних миграций
- `npm run migrate:rollback` - Откат последней миграции
- `npm run migrate:status` - Статус миграций
- `npm run seed:run` - Заполнение тестовыми данными
- `npm run lint` - Проверка кода с ESLint
- `npm run lint:fix` - Автоматическое исправление ошибок ESLint
- `npm run format` - Форматирование кода с Prettier
- `npm run test` - Запуск тестов
- `npm run test:watch` - Запуск тестов в watch режиме

## Структура проекта

```
tma-erp-q/
├── .github/workflows/          # GitHub Actions workflows
├── .continue/                  # Continue AI конфиги и промты
├── docker/                     # Docker конфигурации
│   ├── docker-compose.dev.yml  # Локальный dev стек
│   └── docker-compose.prod.yml # Production стек (опционально)
├── migrations/                 # Миграции базы данных
├── seeds/                      # Тестовые данные
├── src/                        # Исходный код бэкенда
│   ├── config/                 # Конфигурация приложения
│   ├── controllers/            # API контроллеры
│   ├── middleware/             # Express middleware
│   ├── models/                 # Модели данных
│   ├── routes/                 # API маршруты
│   ├── services/               # Бизнес-логика
│   └── utils/                  # Вспомогательные функции
├── public/                     # Фронтенд файлы
│   ├── admin/                  # Веб-админка
│   ├── css/                    # Стили
│   └── telegram-simulator.html # Симулятор Telegram Mini App
├── .env.example               # Пример переменных окружения
├── .eslintrc.json             # Конфигурация ESLint
├── .prettierrc                # Конфигурация Prettier
├── knexfile.js                # Конфигурация Knex.js
├── package.json               # Зависимости и скрипты
├── README.md                  # Эта документация
└── server.js                  # Точка входа приложения
```

## API Endpoints

### Health Checks
- `GET /api/v1/health` - Общий статус приложения
- `GET /api/v1/health/db` - Проверка подключения к БД

### Authentication
- `GET /api/v1/me` - Информация о текущем пользователе

### Development Headers
В режиме разработки используйте следующие заголовки для фейковой авторизации:

```
X-Telegram-ID: dev_user_123
X-First-Name: Разработчик
X-Last-Name: Тестовый
X-Username: dev_user
X-Role: master (или admin, inspector, director, worker)
```

## Тестовые данные

После запуска сидов будут созданы:

### Пользователи:
- Администратор (admin) - полный доступ
- Директор качества (director) - управление конфликтными ситуациями
- Контролёры ОТК (inspector) - проверка заявок
- Мастера (master) - создание заявок, управление несоответствиями
- Рабочие (worker) - устранение несоответствий

### Участки:
- Цех сборки трансформаторов
- Участок обмоток
- Участок покраски
- Склад готовой продукции

### Типы изделий:
- Трансформатор ТСЛ-1000
- Обмотка НН
- Остов трансформатора
- Крепежный болт М12

### Заявки и несоответствия:
- Несколько тестовых заявок в разных статусах
- Примеры несоответствий с разными сценариями

## Развертывание в Production

1. Настройте VPS с Ubuntu 22.04+
2. Установите Node.js 18.20.8+, PostgreSQL 14+, PM2, Nginx
3. Настройте внешнее S3-хранилище (AWS S3, Yandex Object Storage и т.д.)
4. Создайте Telegram бота и получите токен
5. Настройте переменные окружения в .env.production
6. Настройте GitHub Actions для автоматического деплоя

## Лицензия

MIT