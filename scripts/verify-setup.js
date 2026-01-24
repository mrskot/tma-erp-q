#!/usr/bin/env node

console.log('🔧 Проверка настроек проекта TMA-ERP-Q\n');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const checks = [
  {
    name: 'Node.js version',
    check: () => {
      const version = process.version;
      const required = '18.20.8';
      const major = parseInt(version.replace('v', '').split('.')[0], 10);
      return major >= 18 ? '✅' : `❌ Требуется Node.js >= ${required}, текущая: ${version}`;
    },
  },
  {
    name: 'Package.json',
    check: () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      return fs.existsSync(packagePath) ? '✅' : '❌ Файл package.json не найден';
    },
  },
  {
    name: 'Dependencies installed',
    check: () => {
      const nodeModules = path.join(__dirname, '..', 'node_modules');
      return fs.existsSync(nodeModules) ? '✅' : '❌ Зависимости не установлены. Выполните: npm install';
    },
  },
  {
    name: 'Environment file',
    check: () => {
      const envExample = path.join(__dirname, '..', '.env.example');
      const env = path.join(__dirname, '..', '.env');
      
      if (!fs.existsSync(envExample)) {
        return '⚠️  Файл .env.example не найден';
      }
      
      if (!fs.existsSync(env)) {
        return '⚠️  Файл .env не найден. Выполните: cp .env.example .env';
      }
      
      return '✅';
    },
  },
  {
    name: 'Database migrations',
    check: () => {
      const migrationsDir = path.join(__dirname, '..', 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        return '❌ Папка migrations не найдена';
      }
      
      const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));
      return migrations.length >= 8 ? '✅' : `⚠️  Найдено только ${migrations.length} миграций (ожидается 8+)`;
    },
  },
  {
    name: 'Test data seeds',
    check: () => {
      const seedsDir = path.join(__dirname, '..', 'seeds');
      if (!fs.existsSync(seedsDir)) {
        return '❌ Папка seeds не найдена';
      }
      
      const seeds = fs.readdirSync(seedsDir).filter(f => f.endsWith('.js'));
      return seeds.length >= 1 ? '✅' : '⚠️  Тестовые данные не найдены';
    },
  },
  {
    name: 'Source code structure',
    check: () => {
      const srcDir = path.join(__dirname, '..', 'src');
      if (!fs.existsSync(srcDir)) {
        return '❌ Папка src не найдена';
      }
      
      const requiredSubdirs = ['config', 'middleware', 'models', 'routes', 'services', 'utils'];
      const missing = requiredSubdirs.filter(dir => !fs.existsSync(path.join(srcDir, dir)));
      
      return missing.length === 0 ? '✅' : `⚠️  Отсутствуют папки: ${missing.join(', ')}`;
    },
  },
  {
    name: 'Docker configuration',
    check: () => {
      const dockerDir = path.join(__dirname, '..', 'docker');
      if (!fs.existsSync(dockerDir)) {
        return '❌ Папка docker не найдена';
      }
      
      const dockerCompose = path.join(dockerDir, 'docker-compose.dev.yml');
      return fs.existsSync(dockerCompose) ? '✅' : '⚠️  Файл docker-compose.dev.yml не найден';
    },
  },
];

// Выполняем проверки
let allPassed = true;

checks.forEach((check, index) => {
  const result = check.check();
  const status = result === '✅' ? '✅' : result.startsWith('⚠️') ? '⚠️' : '❌';
  
  if (result !== '✅') {
    allPassed = false;
  }
  
  console.log(`${index + 1}. ${check.name}: ${result}`);
});

console.log('\n📊 Итог:');
if (allPassed) {
  console.log('🎉 Все проверки пройдены! Проект готов к работе.');
  console.log('\n🚀 Для запуска выполните:');
  console.log('   1. npm run docker:dev');
  console.log('   2. npm run migrate:latest');
  console.log('   3. npm run seed:run');
  console.log('   4. npm run dev');
} else {
  console.log('⚠️  Некоторые проверки не пройдены. Исправьте указанные проблемы.');
  console.log('\n💡 Для получения подробной информации выполните:');
  console.log('   npm run check');
}

console.log('\n🔧 Дополнительные команды:');
console.log('   npm run lint        - Проверка кода');
console.log('   npm run test        - Запуск тестов');
console.log('   npm run audit       - Проверка уязвимостей');
console.log('   npm run check       - Полная проверка установки');