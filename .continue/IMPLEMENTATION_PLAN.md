# 📋 TMA-ERP-Q - Детальный План Реализации

**Статус**: В процессе разработки  
**Версия**: 1.0.0  
**Последнее обновление**: 21.01.2026

---

## 📖 Содержание

1. [Обзор проекта](#обзор-проекта)
2. [Архитектура](#архитектура)
3. [Фазы реализации](#фазы-реализации)
4. [Детальные шаги](#детальные-шаги)
5. [Технологический стек](#технологический-стек)
6. [Контрольные точки](#контрольные-точки)

---

## 🎯 Обзор проекта

**TMA-ERP-Q** - Telegram Mini App для управления качеством на производстве.

### Основные функции:
- Управление участками производства (Lots)
- Каталог типов изделий с чек-листами (Products)
- Заявки на приёмку ОТК (Applications)
- Управление несоответствиями (Discrepancies)
- Мобильный доступ через Telegram

### Целевые роли:
- **admin** - Администратор системы
- **director** - Директор качества
- **inspector** - Контролёр ОТК
- **master** - Мастер участка
- **worker** - Рабочий

---

## 🏗️ Архитектура

### Стек технологий

```
FRONTEND
├── Telegram Mini App (WebApp API)
├── Vanilla JavaScript (ES6+)
├── HTML5 + CSS3
└── LocalStorage для кеширования

BACKEND
├── Node.js 18.20.8+
├── Express.js 4.18+
├── Knex.js (миграции и QueryBuilder)
├── SQLite 3 (development) ✅ В ИСПОЛЬЗОВАНИИ
├── PostgreSQL 15 (production) - готов к миграции
├── JWT для аутентификации
├── bcryptjs для хеширования паролей
├── express-validator для валидации
└── Winston для логирования

INFRASTRUCTURE
├── Docker Compose (PostgreSQL, MinIO)
├── MinIO для S3-совместимого хранилища
└── GitHub Actions (CI/CD опционально)
```

### Структура БД

```
users                 - Пользователи системы
├── roles: admin, director, inspector, master, worker
└── pin_code для первого входа

lots                  - Участки производства
├── code: ASSEMBLY_1, WINDING_1 и т.д.
├── main_master_id → users
└── temp_master_id → users (замещающий мастер)

products             - Типы изделий
├── product_type: finished, semi_finished, assembly, part
├── checklist: JSON с пунктами проверки
└── lot_id → lots

applications        - Заявки на приёмку
├── status: new, assigned, in_progress, accepted, rejected
├── master_id → users (создатель)
└── mki_photo_url: ссылка на фото МКИ

discrepancies       - Несоответствия (дефекты)
├── status: new, assigned, in_progress, resolved, closed
├── severity: low, medium, high, critical
├── closure_scenario: fixed, resolution_card, scrap, political
└── defect_photo_url: ссылка на фото дефекта

activity_logs       - Логирование действий
├── action_type: create, update, delete, status_change
└── entity_type: user, lot, product, application, discrepancy

system_configs      - Системные конфигурации
└── key-value пары для настроек приложения

sync_jobs           - Очередь задач
├── job_type: telegram_notification, bitrix_sync и т.д.
└── status: pending, processing, completed, failed, retry
```

---

## 📊 Фазы реализации

### ✅ ФАЗА 1: Инфраструктура (ЗАВЕРШЕНА)

**Целью**: Подготовка базовой инфраструктуры проекта.

#### Задачи:
- ✅ Инициализация проекта Node.js
- ✅ Настройка Docker (PostgreSQL, MinIO)
- ✅ Создание 8 миграций БД
- ✅ Заполнение тестовых данных (seeds)
- ✅ Настройка Express сервера
- ✅ Базовый фронтенд shell (HTML + JS)
- ✅ Фейковая аутентификация для разработки
- ✅ Health check endpoints

#### Результаты:
- База данных с таблицами для всех сущностей
- Сервер работает на порту 3000
- 8 тестовых пользователей с разными ролями
- 4 участка, 4 изделия, 3 заявки, 2 несоответствия

---

### ✅ ФАЗА 2: Backend модули (ЗАВЕРШЕНА)

**Целью**: Реализация основной бизнес-логики через RESTful API.

#### Модули:

**1. Users (Пользователи)** ✅ ПОЛНОСТЬЮ РЕАЛИЗОВАНО
- ✅ Модель User (src/models/User.js)
- ✅ Сервис с CRUD операциями (src/services/userService.js)
- ✅ Контроллер с авторизацией (src/controllers/userController.js)
- ✅ Маршруты /api/v1/users (src/routes/userRoutes.js)
- ✅ JWT аутентификация (generateToken)
- ✅ PIN-код верификация (4 цифры)
- ✅ Фейковая аутентификация для разработки
- ✅ Сброс PIN-кода администратором
- ✅ Получение пользователей по ролям
- ✅ Управление статусом пользователя

API Endpoints:
  POST   /api/v1/users/auth/login        - Аутентификация
  POST   /api/v1/users/auth/refresh      - Обновление токена
  GET    /api/v1/users/profile           - Профиль текущего
  GET    /api/v1/users                   - Все пользователи
  GET    /api/v1/users/role/:role        - По роли
  POST   /api/v1/users                   - Создать
  PUT    /api/v1/users/:id               - Обновить
  DELETE /api/v1/users/:id               - Удалить
  POST   /api/v1/users/reset-pin         - Сбросить PIN

**2. Lots (Участки)**
- ✅ Модель Lot
- ✅ Сервис с методами управления участками
- ✅ Контроллер для API
- ✅ Маршруты /api/v1/lots
- ✅ Назначение основного и временного мастера
- ✅ Получение участков по коду и мастеру

**3. Products (Изделия)**
- ✅ Модель Product
- ✅ Сервис с CRUD операциями
- ✅ Контроллер для API
- ✅ Маршруты /api/v1/products
- ✅ Фильтрация по типу и участку
- ✅ Управление чек-листами (JSON)

**4. Applications (Заявки)**
- ✅ Модель Application
- ✅ Сервис с управлением статусами
- ✅ Контроллер для API
- ✅ Маршруты /api/v1/applications
- ✅ Статусы: new → assigned → in_progress → accepted/rejected
- ✅ Генерация уникальных номеров заявок
- ✅ Статистика по статусам

**5. Discrepancies (Несоответствия)**
- ✅ Модель Discrepancy
- ✅ Сервис с управлением несоответствиями
- ✅ Контроллер для API
- ✅ Маршруты /api/v1/discrepancies
- ✅ Статусы: new → assigned → in_progress → resolved → closed
- ✅ Сценарии закрытия: fixed, resolution_card, scrap, political
- ✅ Фильтрация по серьезности

#### API Endpoints:
```
Lots:
  GET    /api/v1/lots                    - Все участки
  GET    /api/v1/lots/:id                - Участок по ID
  GET    /api/v1/lots/code/:code         - Участок по коду
  GET    /api/v1/lots/master/:masterId   - Участки мастера
  POST   /api/v1/lots                    - Создать участок
  PUT    /api/v1/lots/:id                - Обновить участок
  DELETE /api/v1/lots/:id                - Удалить участок
  POST   /api/v1/lots/:id/temp-master    - Назначить врем. мастера
  DELETE /api/v1/lots/:id/temp-master    - Удалить врем. мастера

Products:
  GET    /api/v1/products                - Все изделия
  GET    /api/v1/products/:id            - Изделие по ID
  GET    /api/v1/products/type/:type     - Изделия по типу
  GET    /api/v1/products/lot/:lotId     - Изделия участка
  POST   /api/v1/products                - Создать изделие
  PUT    /api/v1/products/:id            - Обновить изделие
  DELETE /api/v1/products/:id            - Удалить изделие

Applications:
  GET    /api/v1/applications            - Все заявки
  GET    /api/v1/applications/:id        - Заявка по ID
  GET    /api/v1/applications/status/:status - Заявки по статусу
  GET    /api/v1/applications/master/:masterId - Заявки мастера
  GET    /api/v1/applications/statistics - Статистика заявок
  POST   /api/v1/applications            - Создать заявку
  PUT    /api/v1/applications/:id        - Обновить заявку
  PATCH  /api/v1/applications/:id/status - Изменить статус
  DELETE /api/v1/applications/:id        - Удалить заявку

Discrepancies:
  GET    /api/v1/discrepancies           - Все несоответствия
  GET    /api/v1/discrepancies/:id       - Несоответствие по ID
  GET    /api/v1/discrepancies/status/:status - По статусу
  GET    /api/v1/discrepancies/severity/:severity - По серьезности
  GET    /api/v1/discrepancies/responsible/:id - По ответственному
  GET    /api/v1/discrepancies/application/:id - По заявке
  GET    /api/v1/discrepancies/statistics - Статистика
  POST   /api/v1/discrepancies           - Создать несоответствие
  PUT    /api/v1/discrepancies/:id       - Обновить несоответствие
  PATCH  /api/v1/discrepancies/:id/status - Изменить статус
  DELETE /api/v1/discrepancies/:id       - Удалить несоответствие
```

#### Результаты:
- 100+ API endpoints полностью функциональных
- Валидация всех входных данных
- Проверка прав доступа по ролям
- Транзакции и целостность данных

---

### 🔄 ФАЗА 3: Файловое хранилище (В ПЛАНАХ)

**Целью**: Реализовать загрузку фото через S3/MinIO.

#### Задачи:
- [ ] Создать сервис storageService.js
- [ ] Middleware для upload с multer-s3
- [ ] Интеграция в Applications (фото МКИ)
- [ ] Интеграция в Discrepancies (фото дефектов)
- [ ] Управление файлами (удаление, ресайз)

#### API Changes:
```
POST /api/v1/applications/:id/photo    - Загрузить фото МКИ
POST /api/v1/discrepancies/:id/photo   - Загрузить фото дефекта
DELETE /api/v1/files/:key               - Удалить файл
```

---

### 🔄 ФАЗА 4: Telegram интеграция (В ПЛАНАХ)

**Целью**: Интеграция с Telegram Bot и WebApp.

#### Задачи:
- [ ] Telegram Bot для уведомлений
- [ ] Команды бота (/start, /status, /help)
- [ ] Webhook для получения обновлений
- [ ] Реальная валидация initData WebApp
- [ ] Уведомления о новых заявках
- [ ] Уведомления о статус-изменениях

#### Endpoints:
```
POST /api/v1/telegram/webhook           - Webhook от бота
GET  /api/v1/telegram/auth              - WebApp аутентификация
POST /api/v1/notifications              - Отправить уведомление
```

---

Я вижу, что вы предоставили обновленный план реализации проекта TMA-ERP-Q, но не предоставили предыдущий код для применения изменений.

Из вашего сообщения я понимаю, что:
1. Вы хотите обновить план реализации проекта
2. Фаза 5 (Frontend интерфейсы) теперь помечена как "В ПРОЦЕССЕ"
3. В Checkpoint 3 добавлена отметка "В процессе"

Однако, чтобы применить эти изменения к "предыдущему коду", мне нужно видеть:
- Текущий план реализации (который нужно обновить)
- Или структуру проекта, куда нужно добавить эти изменения

**Что я могу сделать:**

1. **Если у вас есть текущий план реализации** - пришлите его, и я обновлю статусы фаз согласно вашему новому плану.

2. **Если вы хотите создать структуру проекта на основе этого плана** - я могу сгенерировать начальную структуру файлов и папок.

3. **Если это обновление для существующего проекта** - уточните, какие конкретные файлы нужно обновить.

**Небольшие улучшения, которые я уже вижу в новом плане:**
- Более детальная структура фронтенда
- Уточненные контрольные точки
- Добавлены дополнительные ресурсы и команды

**Можете ли вы уточнить:**
1. Какой именно "предыдущий код" нужно обновить?
2. Это файл README.md, документация, или структура проекта?
3. Нужно ли создать какие-то конкретные файлы из раздела "Структура файлов фронтенда"?

Я готов помочь применить эти изменения, как только получу больше контекста о том, что именно нужно обновить.

**Целью**: Создать удобный интерфейс для всех ролей.

#### Экраны:

**1. Аутентификация**
- [ ] Экран входа с PIN-кодом
- [ ] Проверка PIN через API
- [ ] Сохранение токена в localStorage
- [ ] Выход из системы

**2. Dashboard**
- [ ] Главная страница для каждой роли
- [ ] Виджеты с метриками
- [ ] Быстрые ссылки на основные функции
- [ ] Уведомления и новости

**3. Управление участками (Lots)**
- [ ] Список участков
- [ ] Детали участка
- [ ] Создание/редактирование участка
- [ ] Назначение мастеров

**4. Управление изделиями (Products)**
- [ ] Список изделий
- [ ] Детали изделия с чек-листом
- [ ] Создание/редактирование изделия
- [ ] Фильтрация по типу и участку

**5. Заявки на приёмку (Applications)**
- [ ] Список заявок с фильтрами
- [ ] Форма создания новой заявки
- [ ] Детали заявки
- [ ] Изменение статуса
- [ ] Загрузка фото МКИ
- [ ] История статус-изменений

**6. Управление несоответствиями (Discrepancies)**
- [ ] Список несоответствий
- [ ] Фильтр по серьезности и статусу
- [ ] Форма создания нового несоответствия
- [ ] Детали несоответствия
- [ ] Сценарии закрытия
- [ ] Загрузка фото дефекта

**7. Администратор**
- [ ] Управление пользователями
- [ ] Управление участками
- [ ] Управление изделиями
- [ ] Просмотр статистики
- [ ] Логирование действий
- [ ] Системные настройки

#### Структура файлов фронтенда:
```
public/
├── index.html              - Главная страница
├── css/
│   ├── style.css          - Основные стили
│   ├── telegram.css       - Стили Telegram Mini App
│   └── dashboard.css      - Стили dashboard
├── js/
│   ├── app.js             - Главное приложение (routing)
│   ├── api.js             - HTTP клиент для API
│   ├── auth.js            - Управление аутентификацией
│   ├── telegram-app.js    - Интеграция Telegram SDK
│   ├── fake-telegram.js   - Фейковый Telegram для разработки
│   ├── components/
│   │   ├── header.js      - Компонент заголовка
│   │   ├── navigation.js  - Компонент меню
│   │   └── loader.js      - Компонент загрузки
│   ├── pages/
│   │   ├── login.js       - Страница входа
│   │   ├── dashboard.js   - Главная панель
│   │   ├── lots.js        - Страница участков
│   │   ├── products.js    - Страница изделий
│   │   ├── applications.js - Страница заявок
│   │   ├── discrepancies.js - Страница несоответствий
│   │   └── admin.js       - Админ панель
│   └── utils/
│       ├── format.js      - Форматирование данных
│       ├── validation.js  - Валидация форм
│       └── helpers.js     - Вспомогательные функции
└── telegram/
    └── index.html         - Telegram Mini App shell
```

---

### 🔄 ФАЗА 6: Тестирование и документация (В ПЛАНАХ)

**Целью**: Обеспечить качество и документированность.

#### Задачи:
- [ ] Unit тесты для всех сервисов (Jest)
- [ ] Integration тесты для API endpoints
- [ ] E2E тесты с Selenium/Puppeteer
- [ ] Тесты безопасности (OWASP)
- [ ] Документация API (Swagger/OpenAPI)
- [ ] Руководство пользователя
- [ ] Руководство администратора
- [ ] Руководство разработчика

#### Покрытие:
- Целевое покрытие: >80% для критических модулей
- Все API endpoints должны иметь тесты
- Все пути обработки ошибок протестированы

---

## 🔧 Детальные шаги

### Шаг за шагом для каждого компонента

#### Пример: Создание модуля Applications

**Шаг 1: Создать Model**
```bash
1. Создать src/models/Application.js
2. Реализовать методы CRUD:
   - findById(id)
   - findAll(limit, offset)
   - findByStatus(status)
   - create(data)
   - update(id, data)
   - delete(id)
   - updateStatus(id, status)
```

**Шаг 2: Создать Service**
```bash
1. Создать src/services/applicationService.js
2. Реализовать бизнес-логику:
   - Валидация данных
   - Проверка связанных сущностей
   - Проверка прав доступа
   - Генерация номеров
   - Обработка ошибок
```

**Шаг 3: Создать Controller**
```bash
1. Создать src/controllers/applicationController.js
2. Реализовать обработчики:
   - getAllApplications()
   - getApplicationById()
   - createApplication()
   - updateApplication()
   - updateApplicationStatus()
   - deleteApplication()
3. Добавить валидацию express-validator
```

**Шаг 4: Создать Routes**
```bash
1. Создать src/routes/applicationRoutes.js
2. Определить маршруты:
   - GET /api/v1/applications
   - GET /api/v1/applications/:id
   - POST /api/v1/applications
   - PUT /api/v1/applications/:id
   - PATCH /api/v1/applications/:id/status
   - DELETE /api/v1/applications/:id
3. Подключить middleware аутентификации
```

**Шаг 5: Подключить к основному router**
```javascript
// src/routes/index.js
const applicationRoutes = require('./applicationRoutes');
router.use('/applications', applicationRoutes);
```

**Шаг 6: Создать тесты**
```bash
1. Создать tests/applications.test.js
2. Написать тесты для:
   - Получение всех заявок
   - Получение по ID
   - Создание новой заявки
   - Обновление заявки
   - Изменение статуса
   - Удаление заявки
3. Протестировать обработку ошибок
```

**Шаг 7: Создать документацию**
```bash
1. Документировать все endpoints
2. Примеры запросов/ответов
3. Коды ошибок и их значения
4. Требования к полям
```

**Шаг 8: Создать Frontend**
```bash
1. Создать список заявок
2. Форма создания заявки
3. Детали заявки
4. Форма изменения статуса
5. Интеграция с API
6. Обработка ошибок
```

---

## 🛠️ Технологический стек

### Backend
- **Node.js** 18.20.8+ - Runtime
- **Express.js** 4.18+ - Web framework
- **Knex.js** 2.4+ - Query builder и миграции
- **SQLite3** 5.1+ - Development БД
- **PostgreSQL** 15+ - Production БД
- **JWT** 9.0+ - Аутентификация
- **express-validator** 7.0+ - Валидация
- **bcryptjs** 2.4+ - Хеширование паролей
- **Winston** 3.10+ - Логирование
- **Multer** 1.4+ - Upload файлов

### Frontend
- **Vanilla JavaScript** ES6+
- **Telegram WebApp SDK** - Интеграция с Telegram
- **LocalStorage** - Кеширование
- **Fetch API** - HTTP запросы
- **HTML5** - Структура
- **CSS3** - Стилизация

### DevOps
- **Docker** - Контейнеризация
- **Docker Compose** - Оркестрация контейнеров
- **MinIO** - S3-совместимое хранилище
- **Nginx** - Reverse proxy (production)
- **PM2** - Process manager (production)

---

## ✓ Контрольные точки

### Checkpoint 1: Инфраструктура ✅
- [x] Node.js проект инициализирован
- [x] PostgreSQL БД готова
- [x] 8 миграций применены
- [x] Тестовые данные загружены
- [x] Express сервер работает
- [x] Health check endpoints функциональны

### Checkpoint 2: Backend ✅
- [x] User модуль с JWT аутентификацией
- [x] Lot модуль полностью функционален
- [x] Product модуль полностью функционален
- [x] Application модуль с управлением статусами
- [x] Discrepancy модуль с сценариями закрытия
- [x] 100+ API endpoints работают
- [x] Все методы имеют валидацию
- [x] Проверка прав доступа реализована

### Checkpoint 3: Frontend ✅ (В процессе)
- [ ] Login страница с PIN-кодом
- [ ] Dashboard для каждой роли
- [ ] Список и детали участков
- [ ] Список и детали изделий
- [ ] Список и форма заявок
- [ ] Список и форма несоответствий
- [ ] Админ панель
- [ ] Все экраны связаны с API

### Checkpoint 4: Хранилище ⏳
- [ ] S3/MinIO интеграция
- [ ] Upload фото МКИ
- [ ] Upload фото дефектов
- [ ] Управление файлами

### Checkpoint 5: Telegram ⏳
- [ ] Telegram Bot работает
- [ ] Webhooks функциональны
- [ ] Уведомления отправляются
- [ ] Реальная валидация initData

### Checkpoint 6: Production ⏳
- [ ] Unit тесты (>80% coverage)
- [ ] Integration тесты API
- [ ] E2E тесты
- [ ] Документация API
- [ ] Руководства пользователя
- [ ] Развертывание на сервер

---

## 📚 Дополнительные ресурсы

### Команды для разработки:
```bash
# Запуск Docker
npm run docker:dev

# Миграции
npm run migrate:latest
npm run migrate:rollback

# Тестовые данные
npm run seed:run

# Запуск сервера
npm run dev

# Проверка кода
npm run lint
npm run lint:fix

# Форматирование
npm run format

# Тесты
npm run test
npm run test:watch
```

### Основные файлы конфигурации:
- `.env.development` - Переменные окружения для разработки
- `.env.example` - Шаблон переменных окружения
- `knexfile.js` - Конфигурация Knex и БД
- `package.json` - Зависимости и скрипты
- `src/config/app.js` - Конфигурация приложения

---

## 🎯 Финальная цель

После завершения всех 6 фаз проект будет:

✅ **Полностью функционален** - все бизнес-процессы реализованы  
✅ **Безопасен** - JWT, валидация, проверка прав  
✅ **Масштабируем** - архитектура поддерживает рост  
✅ **Протестирован** - >80% покрытия тестами  
✅ **Документирован** - полная документация и руководства  
✅ **Готов к production** - развернут и работает на сервере  

**Ожидаемое время реализации:** 2-3 недели интенсивной разработки
