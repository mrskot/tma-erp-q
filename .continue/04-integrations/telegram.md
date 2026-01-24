# ИНТЕГРАЦИЯ С TELEGRAM ДЛЯ TMA-ERP-Q

## Обзор интеграции
Telegram интеграция является ключевым компонентом TMA-ERP-Q, обеспечивающим мобильный доступ к системе через Telegram Bot API. Интеграция поддерживает как реальное взаимодействие с Telegram API, так и Fake Auth для разработки.

## Архитектура интеграции

### Компоненты:
1. **Telegram Bot** - основной бот для взаимодействия с пользователями
2. **Webhook Handler** - обработчик входящих сообщений
3. **Notification Service** - сервис отправки уведомлений
4. **Fake Telegram Auth** - эмулятор для разработки
5. **Queue System** - очередь для надежной отправки сообщений

### Схема работы:
```
[Telegram User] → [Telegram Bot API] → [Webhook] → [TMA-ERP-Q]
       ↑                                              ↓
[Уведомления] ← [Notification Queue] ← [Event System] ← [Business Logic]
```

## Настройка бота

### 1. Создание бота через BotFather
```bash
# Команды в Telegram с @BotFather:
/newbot - создать нового бота
/setdescription - установить описание
/setabouttext - установить информацию о боте
/setuserpic - установить аватар
/setcommands - установить список команд
```

### 2. Команды бота
```
start - Начать работу с ботом
help - Помощь и список команд
applications - Мои заявки
new_application - Создать новую заявку
discrepancies - Мои несоответствия
profile - Мой профиль
notifications - Настройки уведомлений
admin - Административные команды (только для админов)
```

### 3. Настройка Webhook
```javascript
// Пример настройки webhook
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function setWebhook() {
  const response = await axios.post(`${TELEGRAM_API}/setWebhook`, {
    url: `${process.env.APP_URL}/webhook/telegram`,
    max_connections: 40,
    allowed_updates: ['message', 'callback_query', 'inline_query']
  });
  
  console.log('Webhook установлен:', response.data);
}
```

## Реализация Webhook Handler

### Основной обработчик
```javascript
// routes/webhook/telegram.js
const express = require('express');
const router = express.Router();
const telegramService = require('../../services/telegram/service');

router.post('/telegram', async (req, res) => {
  try {
    const update = req.body;
    
    // Валидация секретного токена (опционально)
    if (process.env.TELEGRAM_SECRET_TOKEN) {
      const secret = req.headers['x-telegram-bot-api-secret-token'];
      if (secret !== process.env.TELEGRAM_SECRET_TOKEN) {
        return res.status(403).send('Forbidden');
      }
    }
    
    // Асинхронная обработка
    telegramService.handleUpdate(update).catch(console.error);
    
    // Всегда возвращаем 200 OK Telegram
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
```

### Обработчик сообщений
```javascript
// services/telegram/handler.js
class TelegramHandler {
  async handleUpdate(update) {
    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    } else if (update.inline_query) {
      await this.handleInlineQuery(update.inline_query);
    }
  }
  
  async handleMessage(message) {
    const { chat, text, from } = message;
    
    // Определение команды
    if (text.startsWith('/')) {
      await this.handleCommand(text, chat, from);
    } else {
      await this.handleTextMessage(text, chat, from);
    }
  }
  
  async handleCommand(command, chat, user) {
    const commandMap = {
      '/start': this.handleStart,
      '/help': this.handleHelp,
      '/applications': this.handleApplications,
      '/new_application': this.handleNewApplication,
      '/discrepancies': this.handleDiscrepancies,
      '/profile': this.handleProfile
    };
    
    const handler = commandMap[command.split(' ')[0]];
    if (handler) {
      await handler.call(this, chat, user, command);
    } else {
      await this.sendMessage(chat.id, 'Неизвестная команда. Используйте /help для списка команд.');
    }
  }
}
```

## Сервис уведомлений

### Отправка уведомлений через очередь
```javascript
// services/telegram/notificationService.js
const Queue = require('bull');
const TelegramBot = require('node-telegram-bot-api');

class TelegramNotificationService {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    this.queue = new Queue('telegram-notifications', {
      redis: process.env.REDIS_URL,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });
    
    this.setupQueue();
  }
  
  setupQueue() {
    this.queue.process(async (job) => {
      const { chatId, message, options } = job.data;
      
      try {
        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          ...options
        });
        
        return { success: true, timestamp: new Date() };
      } catch (error) {
        if (error.response && error.response.statusCode === 403) {
          // Пользователь заблокировал бота
          await this.handleBlockedUser(chatId);
          throw new Error(`User blocked bot: ${chatId}`);
        }
        throw error;
      }
    });
    
    this.queue.on('failed', (job, error) => {
      console.error(`Ошибка отправки уведомления: ${error.message}`, {
        jobId: job.id,
        chatId: job.data.chatId,
        retryCount: job.attemptsMade
      });
    });
  }
  
  async sendNotification(chatId, message, options = {}) {
    return this.queue.add({
      chatId,
      message,
      options
    }, {
      priority: options.priority || 'normal'
    });
  }
  
  // Типовые уведомления
  async sendApplicationCreated(application, master) {
    const message = this.formatApplicationMessage(application);
    return this.sendNotification(master.telegramId, message, {
      priority: 'high',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '📋 Открыть заявку',
            url: `${process.env.APP_URL}/applications/${application.id}`
          }
        ]]
      }
    });
  }
  
  async sendDiscrepancyAssigned(discrepancy, responsible) {
    const message = `🔴 Вам назначено несоответствие #${discrepancy.id}\n\n` +
                   `Описание: ${discrepancy.description}\n` +
                   `Серьезность: ${this.getSeriousnessEmoji(discrepancy.seriousness)}\n` +
                   `Срок: до ${formatDate(discrepancy.deadline)}`;
    
    return this.sendNotification(responsible.telegramId, message, {
      priority: 'high'
    });
  }
  
  formatApplicationMessage(application) {
    return `🎯 <b>Новая заявка #${application.id}</b>\n\n` +
           `🏭 Участок: ${application.lot.name}\n` +
           `📦 Изделие: ${application.product.name}\n` +
           `📋 Чертеж: ${application.product.drawingNumber}\n` +
           `⏰ Желаемый срок: ${formatDate(application.desiredDeadline)}\n` +
           `👤 Мастер: ${application.master.fullName}\n\n` +
           `Статус: ${this.getStatusEmoji(application.status)}`;
  }
}
```

## Inline-клавиатуры и интерактивные элементы

### Клавиатура для создания заявки
```javascript
async function showApplicationKeyboard(chatId) {
  const keyboard = {
    reply_markup: {
      keyboard: [
        [{ text: '🏭 Выбрать участок' }],
        [{ text: '📦 Выбрать тип изделия' }],
        [{ text: '📷 Добавить фото МКИ' }],
        [{ text: '✅ Отправить заявку' }, { text: '❌ Отмена' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
  
  await bot.sendMessage(chatId, 'Создание новой заявки:', keyboard);
}

### Inline-клавиатура для действий с заявкой
```javascript
function getApplicationActionsKeyboard(applicationId) {
  return {
    inline_keyboard: [
      [
        { text: '👁️ Просмотреть', callback_data: `view_application_${applicationId}` },
        { text: '✏️ Редактировать', callback_data: `edit_application_${applicationId}` }
      ],
      [
        { text: '📋 Добавить несоответствие', callback_data: `add_discrepancy_${applicationId}` },
        { text: '✅ Завершить контроль', callback_data: `complete_application_${applicationId}` }
      ],
      [
        { text: '🔔 Подписаться на уведомления', callback_data: `subscribe_${applicationId}` }
      ]
    ]
  };
}
```

### Обработка callback queries
```javascript
async function handleCallbackQuery(callbackQuery) {
  const { data, message, from } = callbackQuery;
  const [action, entity, id] = data.split('_');
  
  switch (action) {
    case 'view':
      await handleViewEntity(entity, id, message.chat.id, from);
      break;
    case 'edit':
      await handleEditEntity(entity, id, message.chat.id, from);
      break;
    case 'add':
      await handleAddDiscrepancy(id, message.chat.id, from);
      break;
    case 'complete':
      await handleCompleteApplication(id, message.chat.id, from);
      break;
    case 'subscribe':
      await handleSubscribe(id, from.id);
      break;
  }
  
  // Ответ на callback query
  await bot.answerCallbackQuery(callbackQuery.id, {
    text: 'Действие выполнено',
    show_alert: false
  });
}
```

## Fake Telegram Auth для разработки

### Конфигурация
```javascript
// config/telegram.js
const isDevelopment = process.env.NODE_ENV === 'development';
const useFakeTelegram = isDevelopment && process.env.USE_FAKE_TELEGRAM === 'true';

module.exports = {
  useFakeTelegram,
  fakeTelegramConfig: {
    // Тестовые пользователи
    testUsers: [
      {
        telegram_id: '123456789',
        username: 'test_master',
        full_name: 'Тестовый Мастер',
        role: 'master',
        lots: ['lot_uuid_1', 'lot_uuid_2']
      },
      {
        telegram_id: '987654321',
        username: 'test_inspector',
        full_name: 'Тестовый Контролёр',
        role: 'otk_inspector'
      }
    ],
    
    // Эмуляция задержек
    simulateDelay: true,
    minDelay: 100,
    maxDelay: 1000,
    
    // Эмуляция ошибок (для тестирования)
    simulateErrors: false,
    errorRate: 0.1
  }
};
```

### Fake Telegram Service
```javascript
// services/telegram/fakeTelegramService.js
class FakeTelegramService {
  constructor(config) {
    this.testUsers = config.testUsers;
    this.simulateDelay = config.simulateDelay;
    this.minDelay = config.minDelay;
    this.maxDelay = config.maxDelay;
    this.simulateErrors = config.simulateErrors;
    this.errorRate = config.errorRate;
    
    this.messages = [];
    this.callbacks = [];
  }
  
  async sendMessage(chatId, message, options = {}) {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateError()) {
      throw new Error('Fake Telegram API error: Simulated network failure');
    }
    
    const msg = {
      id: Date.now(),
      chatId,
      message,
      options,
      timestamp: new Date(),
      type: 'outgoing'
    };
    
    this.messages.push(msg);
    console.log('[FAKE TELEGRAM] Отправлено сообщение:', {
      to: chatId,
      length: message.length,
      hasKeyboard: !!options.reply_markup
    });
    
    return msg;
  }
  
  async simulateNetworkDelay() {
    if (this.simulateDelay) {
      const delay = Math.floor(
        Math.random() * (this.maxDelay - this.minDelay) + this.minDelay
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  shouldSimulateError() {
    return this.simulateErrors && Math.random() < this.errorRate;
  }
  
  // Метод для тестирования - имитация входящего сообщения
  async simulateIncomingMessage(telegramId, text) {
    const user = this.testUsers.find(u => u.telegram_id === telegramId);
    if (!user) {
      throw new Error(`Test user with telegram_id ${telegramId} not found`);
    }
    
    const fakeUpdate = {
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: {
          id: parseInt(telegramId),
          is_bot: false,
          first_name: user.full_name.split(' ')[0],
          username: user.username
        },
        chat: {
          id: parseInt(telegramId),
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: text
      }
    };
    
    // Вызов реального обработчика
    await telegramHandler.handleUpdate(fakeUpdate);
  }
}
```

## Безопасность и ограничения

### 1. Валидация пользователей
```javascript
async function validateTelegramUser(telegramId, username) {
  // Проверка в базе данных
  const user = await User.findOne({ where: { telegram_id: telegramId } });
  
  if (!user) {
    // Автоматическая регистрация (опционально)
    if (process.env.AUTO_REGISTER_TELEGRAM_USERS) {
      return await registerTelegramUser(telegramId, username);
    }
    throw new Error('Пользователь не найден в системе');
  }
  
  if (!user.is_active) {
    throw new Error('Пользователь деактивирован');
  }
  
  return user;
}
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const telegramLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с вашего IP, попробуйте позже',
  skip: (req) => {
    // Пропускаем webhook от Telegram
    return req.path === '/webhook/telegram' && 
           req.headers['x-telegram-bot-api-secret-token'];
  }
});
```

### 3. Валидация Webhook
```javascript
function validateTelegramWebhook(req) {
  // Проверка секретного токена
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
    return false;
  }
  
  // Проверка IP адреса (опционально)
  const telegramIPs = [
    '91.108.4.0/22',
    '91.108.8.0/22',
    '91.108.12.0/22',
    '91.108.16.0/22',
    '91.108.56.0/22',
    '149.154.160.0/20',
    '2001:67c:4e8::/48',
    '2001:b28:f23d::/48',
    '2001:b28:f23f::/48'
  ];
  
  const clientIP = req.ip;
  return isIPInRange(clientIP, telegramIPs);
}