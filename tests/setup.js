// Глобальные настройки для тестов

// Увеличиваем таймаут для тестов
jest.setTimeout(10000);

// Мокаем console.log для чистоты вывода
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Глобальные переменные для тестов
global.testUser = {
  telegramId: 'test_user_123',
  firstName: 'Test',
  lastName: 'User',
  username: 'test_user',
  role: 'master',
  pinCode: '1234',
};

global.testHeaders = {
  'X-Telegram-ID': 'test_user_123',
  'X-First-Name': 'Test',
  'X-Last-Name': 'User',
  'X-Username': 'test_user',
  'X-Role': 'master',
  'X-PIN-Code': '1234',
};

// Вспомогательные функции
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.generateTestData = () => ({
  timestamp: new Date().toISOString(),
  random: Math.random().toString(36).substring(7),
});