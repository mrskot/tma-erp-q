const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

const db = knex(config);

// Тест подключения при инициализации
async function initializeDatabase() {
  try {
    await db.raw('SELECT 1');
    console.log(`✅ База данных подключена (${config.client})`);
    
    // Проверяем версию PostgreSQL
    if (config.client === 'postgresql') {
      const result = await db.raw('SELECT version()');
      console.log(`🐘 PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
    console.error('💡 Убедитесь, что Docker контейнер запущен: npm run docker:dev');
    return false;
  }
}

// Инициализируем при загрузке
initializeDatabase().then(success => {
  if (!success && process.env.NODE_ENV !== 'test') {
    console.error('Не удалось подключиться к базе данных. Проверьте конфигурацию.');
  }
});

module.exports = db;