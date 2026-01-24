# РУКОВОДСТВО РАЗРАБОТЧИКА TMA-ERP-Q

## Введение
Это руководство предназначено для разработчиков, работающих над проектом TMA-ERP-Q. Оно охватывает архитектуру, кодстайл, рабочие процессы и лучшие практики разработки.

## Архитектура проекта

### 1. Общая архитектура
TMA-ERP-Q построен по принципам **многослойной архитектуры** с четким разделением ответственности:

```
┌─────────────────────────────────────────┐
│            Presentation Layer           │
│  • Telegram Bot Interface              │
│  • Web Admin Panel                     │
│  • REST API                            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Application Layer             │
│  • Controllers (маршрутизация)         │
│  • Services (бизнес-логика)            │
│  • Middleware (промежуточное ПО)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            Domain Layer                 │
│  • Models (сущности)                   │
│  • Repositories (доступ к данным)      │
│  • Business Rules (правила)            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Infrastructure Layer           │
│  • Database (PostgreSQL)               │
│  • External APIs (Telegram, Bitrix24)  │
│  • File Storage (S3)                   │
│  • Queue System (для интеграций)       │
└─────────────────────────────────────────┘
```

### 2. Структура каталогов
```
src/
├── config/           # Конфигурации приложения
│   ├── database.js   # Настройки БД
│   ├── telegram.js   # Настройки Telegram
│   └── index.js      # Экспорт конфигураций
│
├── controllers/      # Контроллеры (обработчики запросов)
│   ├── auth.js       # Аутентификация
│   ├── applications.js # Заявки
│   ├── discrepancies.js # Несоответствия
│   └── users.js      # Пользователи
│
├── middleware/       # Промежуточное ПО
│   ├── auth.js       # Проверка аутентификации
│   ├── validation.js # Валидация данных
│   ├── logging.js    # Логирование
│   └── errorHandler.js # Обработка ошибок
│
├── models/           # Модели данных (Sequelize)
│   ├── User.js       # Пользователи
│   ├── Application.js # Заявки
│   ├── Discrepancy.js # Несоответствия
│   ├── Lot.js        # Участки
│   ├── Product.js    # Типы изделий
│   └── ActivityLog.js # Лог активности
│
├── routes/           # Маршруты API
│   ├── api/          # Основные API endpoints
│   │   ├── auth.js   # Аутентификация
│   │   ├── applications.js
│   │   ├── discrepancies.js
│   │   └── users.js
│   └── webhook/      # Webhook endpoints
│       └── telegram.js
│
├── services/         # Бизнес-логика
│   ├── auth/         # Сервисы аутентификации
│   ├── applications/ # Сервисы заявок
│   ├── discrepancies/ # Сервисы несоответствий
│   ├── notifications/ # Уведомления
│   └── sync/         # Синхронизация
│
├── utils/            # Вспомогательные функции
│   ├── validators.js # Валидаторы
│   ├── formatters.js # Форматирование
│   ├── telegram.js   # Утилиты Telegram
│   └── bitrix24.js   # Утилиты Bitrix24
│
└── queues/           # Очереди заданий
    ├── workers/      # Воркеры
    └── jobs/         # Задания
```

## Кодстайл и стандарты

### 1. JavaScript/Node.js стандарты
- **ES6+:** Используйте современный JavaScript
- **Async/Await:** Предпочитайте async/await над callback/promise chains
- **Константы:** Верхний регистр с подчеркиваниями (`MAX_RETRY_COUNT`)
- **Переменные:** camelCase для переменных и функций
- **Классы:** PascalCase для классов и конструкторов

### 2. Именование файлов
- **Контроллеры:** `camelCase.js` (например: `applicationsController.js`)
- **Модели:** `PascalCase.js` (например: `Application.js`)
- **Сервисы:** `camelCase.js` (например: `applicationService.js`)
- **Маршруты:** `kebab-case.js` (например: `applications-routes.js`)

### 3. Комментарии и документация
```javascript
/**
 * Создает новую заявку на контроль качества
 * @param {Object} applicationData - Данные заявки
 * @param {string} applicationData.lotId - ID участка
 * @param {string} applicationData.productId - ID типа изделия
 * @param {Date} applicationData.desiredDeadline - Желаемый срок
 * @returns {Promise<Application>} Созданная заявка
 * @throws {ValidationError} Если данные невалидны
 * @throws {DatabaseError} При ошибке БД
 */
async function createApplication(applicationData) {
  // Реализация
}
```

### 4. Обработка ошибок
```javascript
// Правильно:
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('Ошибка при выполнении операции:', error);
  throw new ApplicationError('Не удалось выполнить операцию', {
    originalError: error,
    context: { userId, operation }
  });
}

// Неправильно:
someAsyncOperation()
  .then(result => {
    // обработка
  })
  .catch(error => {
    console.log(error); // ❌ Не используйте console.log в production
  });
```

## Рабочие процессы

### 1. Разработка новой фичи
1. **Создание ветки:** `feature/название-фичи`
2. **Реализация:**
   - Создание/обновление моделей
   - Реализация сервисов
   - Добавление контроллеров и маршрутов
   - Написание тестов
3. **Тестирование:**
   - Unit тесты
   - Интеграционные тесты
   - Ручное тестирование
4. **Code Review:** Создание Pull Request
5. **Слияние:** После утверждения

### 2. Исправление бага
1. **Создание ветки:** `bugfix/описание-бага`
2. **Воспроизведение:** Создание теста, воспроизводящего баг
3. **Исправление:** Минимальные изменения для исправления
4. **Тестирование:** Убедиться, что баг исправлен и не сломаны другие функции
5. **Code Review и слияние**

### 3. Работа с базой данных
```bash
# Создание новой миграции
npm run db:migrate:create --name=add_priority_to_lots

# Запуск миграций
npm run db:migrate

# Откат последней миграции
npm run db:migrate:undo

# Заполнение тестовыми данными
npm run db:seed
```

## Бизнес-логика и доменные правила

### 1. Критические бизнес-правила (из concepts.md)
```javascript
// Пример реализации агрегации статуса заявки
class ApplicationService {
  async updateApplicationStatus(applicationId) {
    const application = await Application.findByPk(applicationId, {
      include: [Discrepancy]
    });
    
    // Правило: Агрегация статуса на основе несоответствий
    if (application.discrepancies.length === 0) {
      application.status = 'принята';
    } else {
      const hasOpenDiscrepancies = application.discrepancies.some(
        d => d.status !== 'устранено'
      );
      application.status = hasOpenDiscrepancies ? 'отклонена' : 'принята';
    }
    
    await application.save();
    await ActivityLog.create({
      entityType: 'application',
      entityId: applicationId,
      action: 'status_updated',
      newValues: { status: application.status }
    });
  }
}
```

### 2. Работа с ролями пользователей
```javascript
// Middleware для проверки ролей
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Недостаточно прав',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// Использование в маршрутах
router.post('/applications', 
  authenticate,
  requireRole('master', 'admin'),
  applicationsController.create
);
```

## Интеграции

### 1. Telegram интеграция
```javascript
// services/telegram/notificationService.js
class TelegramNotificationService {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    this.queue = new Queue('telegram-notifications');
  }
  
  async sendApplicationCreated(application, master) {
    const message = `🎯 Новая заявка #${application.id}
Участок: ${application.lot.name}
Изделие: ${application.product.name}
Срок: ${formatDate(application.desiredDeadline)}`;
    
    // Отправка через очередь для надежности
    await this.queue.add('send-message', {
      chatId: master.telegramId,
      message,
      parseMode: 'HTML'
    });
  }
}
```

### 2. Bitrix24 интеграция (опциональная)
```javascript
// services/sync/bitrix24SyncService.js
class Bitrix24SyncService {
  async syncApplicationToBitrix24(application) {
    if (!process.env.BITRIX24_ENABLED) {
      return; // Интеграция отключена
    }
    
    try {
      const dealData = this.mapApplicationToDeal(application);
      const response = await bitrix24API.createDeal(dealData);
      
      await SyncStatus.create({
        entityType: 'application',
        entityId: application.id,
        externalSystem: 'bitrix24',
        externalId: response.id,
        status: 'synced'
      });
    } catch (error) {
      // Retry через очередь
      await this.queue.add('retry-bitrix-sync', {
        applicationId: application.id,
        retryCount: 0
      });
    }
  }
}
```

## Тестирование

### 1. Типы тестов
```javascript
// Unit тесты (Jest)
describe('ApplicationService', () => {
  test('should calculate correct application status', () => {
    const service = new ApplicationService();
    const application = { discrepancies: [] };
    const status = service.calculateStatus(application);
    expect(status).toBe('принята');
  });
});

// Интеграционные тесты
describe('Applications API', () => {
  test('POST /api/applications should create application', async () => {
    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${testToken}`)
      .send(validApplicationData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### 2. Запуск тестов
```bash
# Все тесты
npm test

# Только unit тесты
npm run test:unit

# Только интеграционные тесты
npm run test:integration

# Тесты с покрытием
npm run test:coverage

# Watch mode для разработки
npm run test:watch
```

## Производительность и оптимизация

### 1. Оптимизация запросов к БД
```javascript
// Плохо: N+1 проблема
const applications = await Application.findAll();
for (const app of applications) {
  const lot = await app.getLot(); // Отдельный запрос для каждой заявки
}

// Хорошо: Eager loading
const applications = await Application.findAll({
  include: [
    { model: Lot, attributes: ['id', 'name', 'priority'] },
    { model: Product, attributes: ['id', 'name', 'drawingNumber'] },
    { 
      model: Discrepancy,
      include: [{ model: User, as: 'responsible' }]
    }
  ],
  limit: 50,
  offset: 0
});
```

### 2. Кэширование
```javascript
// services/cache/redisService.js
class CacheService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.defaultTTL = 3600; // 1 час
  }
  
  async getCachedProducts() {
    const cacheKey = 'products:all';
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const products = await Product.findAll();
    await this.redis.setex(cacheKey, this.defaultTTL, JSON.stringify(products));
    return products;
  }
}
```

## Безопасность

### 1. Валидация входных данных
```javascript
// utils/validators.js
const applicationSchema = Joi.object({
  lotId: Joi.string().uuid().required(),
  productId: Joi.string().uuid().required(),
  desiredDeadline: Joi.date().min('now').required(),
  photos: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      description: Joi.string().max(500)
    })
  ).max(10)
});

// middleware/validation.js
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: error.details.map(d => d.message)
      });
    }
    
    req.validatedData = value;
    next();
  };
};
```

### 2. Защита от SQL-инъекций
```javascript
// Используйте параметризованные запросы
// Плохо:
const query = `SELECT * FROM users WHERE telegram_id = '${telegramId}'`;

// Хорошо:
const [users] = await sequelize.query(
  'SELECT * FROM users WHERE telegram_id = ?',
  {
    replacements: [telegramId],
    type: QueryTypes.SELECT
  }
);
```

## Мониторинг и логирование

### 1. Структурированное логирование
```javascript
// config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Использование
logger.info('Заявка создана', { 
  applicationId, 
  userId, 
  lotId 
});

logger.error('Ошибка при синхронизации с Bitrix24', {
  error: error.message,
  stack: error.stack,
  context: { applicationId, retryCount }
});
```

### 2. Health checks
```javascript
// routes/health.js
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});

router.get('/health/db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'connected', database: 'PostgreSQL' });
  } catch (error) {
    res.status(503).json({ 
      status: 'disconnected', 
      error: error.message 
    });
  }
});