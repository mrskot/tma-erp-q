const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testAPI() {
  console.log('🧪 Тестирование API TMA-ERP-Q\n');

  try {
    // 1. Проверка здоровья сервера
    console.log('1. Проверка здоровья сервера...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`   ✅ Сервер работает: ${healthResponse.data.message}`);
    console.log(`   📊 Версия: ${healthResponse.data.version}`);
    console.log(`   🌍 Окружение: ${healthResponse.data.environment}\n`);

    // 2. Проверка базы данных
    console.log('2. Проверка подключения к базе данных...');
    try {
      const dbHealthResponse = await axios.get(`${API_BASE_URL}/health/db`);
      console.log(`   ✅ База данных: ${dbHealthResponse.data.message}\n`);
    } catch (error) {
      console.log(`   ❌ Ошибка базы данных: ${error.response?.data?.message || error.message}\n`);
    }

    // 3. Аутентификация тестового пользователя
    console.log('3. Тестирование аутентификации...');
    try {
      const authResponse = await axios.post(`${API_BASE_URL}/users/auth/login`, {
        telegram_id: 'admin_123',
        pin_code: '1234'
      });
      
      if (authResponse.data.success) {
        console.log(`   ✅ Аутентификация успешна`);
        console.log(`   👤 Пользователь: ${authResponse.data.data.user.first_name} ${authResponse.data.data.user.last_name}`);
        console.log(`   🎫 Роль: ${authResponse.data.data.user.role}`);
        console.log(`   🔑 Токен получен: ${authResponse.data.data.token ? 'Да' : 'Нет'}\n`);
        
        const token = authResponse.data.data.token;
        
        // 4. Получение профиля
        console.log('4. Получение профиля пользователя...');
        const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (profileResponse.data.success) {
          console.log(`   ✅ Профиль получен`);
          console.log(`   📧 Username: ${profileResponse.data.data.username}`);
          console.log(`   📞 Телефон: ${profileResponse.data.data.phone_number || 'не указан'}\n`);
        }

        // 5. Получение списка пользователей (только для админов)
        console.log('5. Получение списка пользователей...');
        try {
          const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (usersResponse.data.success) {
            console.log(`   ✅ Пользователей в системе: ${usersResponse.data.pagination.total}`);
            console.log(`   📋 Роли пользователей:`);
            
            const roleCount = {};
            usersResponse.data.data.forEach(user => {
              roleCount[user.role] = (roleCount[user.role] || 0) + 1;
            });
            
            Object.entries(roleCount).forEach(([role, count]) => {
              console.log(`      ${role}: ${count} пользователей`);
            });
            console.log('');
          }
        } catch (error) {
          console.log(`   ⚠️  Доступ запрещен (требуется роль admin): ${error.response?.data?.message || error.message}\n`);
        }

        // 6. Обновление токена
        console.log('6. Обновление JWT токена...');
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}/users/auth/refresh`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (refreshResponse.data.success) {
            console.log(`   ✅ Токен успешно обновлен\n`);
          }
        } catch (error) {
          console.log(`   ❌ Ошибка обновления токена: ${error.response?.data?.message || error.message}\n`);
        }

      }
    } catch (error) {
      console.log(`   ❌ Ошибка аутентификации: ${error.response?.data?.message || error.message}\n`);
      
      // Если аутентификация не удалась, покажем доступные пользователи из сидов
      console.log('   📋 Доступные тестовые пользователи из сидов:');
      console.log('      Telegram ID: admin_123, PIN: 1234, Роль: admin');
      console.log('      Telegram ID: director_456, PIN: 4567, Роль: director');
      console.log('      Telegram ID: inspector_789, PIN: 7890, Роль: inspector');
      console.log('      Telegram ID: master_111, PIN: 1111, Роль: master');
      console.log('      Telegram ID: worker_444, PIN: 4444, Роль: worker\n');
    }

    // 7. Проверка эндпоинта /me
    console.log('7. Проверка эндпоинта /me (с заголовками fake auth)...');
    try {
      const meResponse = await axios.get(`${API_BASE_URL}/me`, {
        headers: {
          'X-Telegram-ID': 'dev_user_123',
          'X-First-Name': 'Тестовый',
          'X-Last-Name': 'Пользователь',
          'X-Username': 'test_user',
          'X-Role': 'master'
        }
      });
      
      console.log(`   ✅ Fake auth работает`);
      console.log(`   👤 Пользователь: ${meResponse.data.user.firstName} ${meResponse.data.user.lastName}`);
      console.log(`   🎫 Роль: ${meResponse.data.user.role}`);
      console.log(`   🔧 Fake auth: ${meResponse.data.isFakeAuth ? 'Да' : 'Нет'}\n`);
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.response?.data?.message || error.message}\n`);
    }

    console.log('🎉 Тестирование завершено!');
    console.log('\n📚 Доступные эндпоинты:');
    console.log('   GET  /api/v1/health          - Проверка здоровья сервера');
    console.log('   GET  /api/v1/health/db       - Проверка базы данных');
    console.log('   GET  /api/v1/me              - Информация о текущем пользователе (fake auth)');
    console.log('   POST /api/v1/users/auth/login - Аутентификация по PIN-коду');
    console.log('   POST /api/v1/users/auth/refresh - Обновление токена');
    console.log('   GET  /api/v1/users/profile   - Профиль пользователя (требуется токен)');
    console.log('   GET  /api/v1/users           - Список пользователей (admin)');
    console.log('\n🔧 Для разработки используйте заголовки:');
    console.log('   X-Telegram-ID: dev_user_123');
    console.log('   X-First-Name: Имя');
    console.log('   X-Last-Name: Фамилия');
    console.log('   X-Username: username');
    console.log('   X-Role: worker/master/inspector/director/admin');

  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error.message);
    console.log('\n🔧 Убедитесь, что:');
    console.log('   1. Сервер запущен (npm run dev)');
    console.log('   2. База данных инициализирована (npm run migrate:latest)');
    console.log('   3. Тестовые данные загружены (npm run seed:run)');
    process.exit(1);
  }
}

// Запуск тестов
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;