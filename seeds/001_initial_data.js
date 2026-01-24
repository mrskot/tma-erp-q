exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('sync_jobs').del();
  await knex('system_configs').del();
  await knex('activity_logs').del();
  await knex('discrepancies').del();
  await knex('applications').del();
  await knex('products').del();
  await knex('lots').del();
  await knex('users').del();

  // Inserts seed entries
  
  // 1. Пользователи
  const users = await knex('users').insert([
    {
      telegram_id: 'admin_123',
      first_name: 'Администратор',
      last_name: 'Системы',
      username: 'admin',
      bitrix_id: '1001',
      pin_code: '1234',
      role: 'admin',
      is_active: true,
    },
    {
      telegram_id: 'director_456',
      first_name: 'Иван',
      last_name: 'Петров',
      username: 'quality_director',
      bitrix_id: '1002',
      pin_code: '4567',
      role: 'director',
      is_active: true,
    },
    {
      telegram_id: 'inspector_789',
      first_name: 'Мария',
      last_name: 'Сидорова',
      username: 'otk_inspector',
      bitrix_id: '1003',
      pin_code: '7890',
      role: 'inspector',
      is_active: true,
    },
    {
      telegram_id: 'inspector_999',
      first_name: 'Сергей',
      last_name: 'Васильев',
      username: 'otk_inspector2',
      bitrix_id: '1004',
      pin_code: '9999',
      role: 'inspector',
      is_active: true,
    },
    {
      telegram_id: 'master_111',
      first_name: 'Алексей',
      last_name: 'Кузнецов',
      username: 'master_alex',
      bitrix_id: '1005',
      pin_code: '1111',
      role: 'master',
      is_active: true,
    },
    {
      telegram_id: 'master_222',
      first_name: 'Ольга',
      last_name: 'Иванова',
      username: 'master_olga',
      bitrix_id: '1006',
      pin_code: '2222',
      role: 'master',
      is_active: true,
    },
    {
      telegram_id: 'master_333',
      first_name: 'Дмитрий',
      last_name: 'Соколов',
      username: 'master_dmitry',
      bitrix_id: '1007',
      pin_code: '3333',
      role: 'master',
      is_active: true,
    },
    {
      telegram_id: 'worker_444',
      first_name: 'Петр',
      last_name: 'Смирнов',
      username: 'worker_petr',
      bitrix_id: '1008',
      pin_code: '4444',
      role: 'worker',
      is_active: true,
    },
    {
      telegram_id: 'worker_555',
      first_name: 'Елена',
      last_name: 'Попова',
      username: 'worker_elena',
      bitrix_id: '1009',
      pin_code: '5555',
      role: 'worker',
      is_active: true,
    }
  ]).returning('id');

  // 2. Участки (Lots)
  const lots = await knex('lots').insert([
    {
      name: 'Цех сборки трансформаторов',
      code: 'ASSEMBLY_1',
      priority: 1,
      distance_to_office: 150.5,
      main_master_id: users[4].id, // Алексей Кузнецов
      temp_master_id: users[6].id, // Дмитрий Соколов - замещающий мастер
      is_active: true,
    },
    {
      name: 'Участок обмоток',
      code: 'WINDING_1',
      priority: 2,
      distance_to_office: 200.0,
      main_master_id: users[5].id, // Ольга Иванова
      temp_master_id: users[4].id, // Алексей Кузнецов - замещающий мастер
      is_active: true,
    },
    {
      name: 'Участок покраски',
      code: 'PAINTING_1',
      priority: 3,
      distance_to_office: 300.0,
      main_master_id: users[4].id, // Алексей Кузнецов (может быть мастером нескольких участков)
      temp_master_id: users[5].id, // Ольга Иванова - замещающий мастер
      is_active: true,
    },
    {
      name: 'Склад готовой продукции',
      code: 'WAREHOUSE_1',
      priority: 4,
      distance_to_office: 500.0,
      main_master_id: users[5].id, // Ольга Иванова
      temp_master_id: users[6].id, // Дмитрий Соколов - замещающий мастер
      is_active: true,
    },
  ]).returning('id');

  // 3. Типы изделий (Products)
  const products = await knex('products').insert([
    {
      name: 'Трансформатор ТСЛ-1000',
      affiliation: 'ТСЛ',
      product_type: 'finished',
      unit_of_measure: 'шт',
      lot_id: lots[0].id, // Цех сборки
      default_inspector_id: users[2].id, // Мария Сидорова - контролёр по умолчанию
      checklist: JSON.stringify([
        'Проверить маркировку',
        'Проверить крепление узлов',
        'Проверить изоляцию',
        'Проверить покраску',
      ]),
      inspection_time_minutes: 45,
      is_active: true,
    },
    {
      name: 'Обмотка НН',
      affiliation: 'ТМГ',
      product_type: 'semi_finished',
      unit_of_measure: 'компл',
      lot_id: lots[1].id, // Участок обмоток
      default_inspector_id: users[3].id, // Сергей Васильев - контролёр по умолчанию
      previous_lot_id: null,
      next_lot_id: lots[0].id, // Далее в цех сборки
      checklist: JSON.stringify([
        'Проверить количество витков',
        'Проверить изоляцию',
        'Проверить маркировку выводов',
      ]),
      inspection_time_minutes: 30,
      is_active: true,
    },
    {
      name: 'Остов трансформатора',
      affiliation: 'ТМ',
      product_type: 'assembly',
      unit_of_measure: 'шт',
      lot_id: lots[0].id, // Цех сборки
      default_inspector_id: users[2].id, // Мария Сидорова - контролёр по умолчанию
      checklist: JSON.stringify([
        'Проверить геометрию',
        'Проверить сварные швы',
        'Проверить отверстия',
      ]),
      inspection_time_minutes: 25,
      is_active: true,
    },
    {
      name: 'Крепежный болт М12',
      affiliation: 'оснастка',
      product_type: 'part',
      unit_of_measure: 'шт',
      lot_id: lots[3].id, // Склад
      default_inspector_id: users[3].id, // Сергей Васильев - контролёр по умолчанию
      checklist: JSON.stringify([
        'Проверить резьбу',
        'Проверить размер',
        'Проверить марку стали',
      ]),
      inspection_time_minutes: 5,
      is_active: true,
    },
  ]).returning('id');

  // 4. Заявки на приёмку (Applications) - используем совместимый с SQLite синтаксис
  const now = new Date();
  const applications = await knex('applications').insert([
    {
      application_number: 'APP-2024-001',
      master_id: users[4].id, // Алексей Кузнецов
      lot_id: lots[0].id, // Цех сборки
      product_id: products[0].id, // Трансформатор ТСЛ-1000
      serial_number: 'TSL-1000-001',
      quantity: 1,
      desired_inspection_time: new Date(now.getTime() + 2 * 60 * 60 * 1000), // +2 часа
      status: 'new',
      is_active: true,
    },
    {
      application_number: 'APP-2024-002',
      master_id: users[5].id, // Ольга Иванова
      lot_id: lots[1].id, // Участок обмоток
      product_id: products[1].id, // Обмотка НН
      serial_number: 'WIND-001',
      quantity: 10,
      desired_inspection_time: new Date(now.getTime() + 1 * 60 * 60 * 1000), // +1 час
      assigned_at: new Date(now.getTime() - 30 * 60 * 1000), // -30 минут
      status: 'assigned',
      is_active: true,
    },
    {
      application_number: 'APP-2024-003',
      master_id: users[4].id, // Алексей Кузнецов
      lot_id: lots[0].id, // Цех сборки
      product_id: products[2].id, // Остов трансформатора
      serial_number: 'CORE-001',
      quantity: 2,
      desired_inspection_time: new Date(now.getTime() + 3 * 60 * 60 * 1000), // +3 часа
      assigned_at: new Date(now.getTime() - 1 * 60 * 60 * 1000), // -1 час
      started_at: new Date(now.getTime() - 45 * 60 * 1000), // -45 минут
      status: 'in_progress',
      is_active: true,
    },
  ]).returning('id');

  // 5. Несоответствия (Discrepancies)
  await knex('discrepancies').insert([
    {
      discrepancy_number: 'DISC-2024-001',
      application_id: applications[2].id, // Связано с заявкой APP-2024-003
      title: 'Трещина в сварном шве',
      description: 'Обнаружена трещина длиной 2см в продольном сварном шве',
      severity: 'high',
      responsible_id: users[4].id, // Алексей Кузнецов (мастер участка)
      inspector_id: users[2].id, // Мария Сидорова (инспектор)
      detected_at: new Date(now.getTime() - 40 * 60 * 1000), // -40 минут
      status: 'assigned',
      is_active: true,
    },
    {
      discrepancy_number: 'DISC-2024-002',
      application_id: null, // Автономное несоответствие
      title: 'Несоответствие чертежу',
      description: 'Отверстия расположены с отклонением 3мм от чертежа',
      severity: 'medium',
      responsible_id: users[5].id, // Ольга Иванова
      assigned_worker_id: users[7].id, // Петр Смирнов (рабочий)
      inspector_id: users[3].id, // Сергей Васильев
      detected_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // -2 дня
      status: 'in_progress',
      started_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // -1 день
      is_active: true,
    },
  ]);

  // 6. Системные конфигурации
  await knex('system_configs').insert([
    {
      key: 'require_photo_for_application',
      value: JSON.stringify(true),
      data_type: 'boolean',
      category: 'validation',
      description: 'Требовать фото МКИ при создании заявки',
      is_public: false,
      is_encrypted: false,
    },
    {
      key: 'require_photo_for_discrepancy',
      value: JSON.stringify(true),
      data_type: 'boolean',
      category: 'validation',
      description: 'Требовать фото дефекта при создании несоответствия',
      is_public: false,
      is_encrypted: false,
    },
    {
      key: 'default_sla_hours',
      value: JSON.stringify(24),
      data_type: 'number',
      category: 'sla',
      description: 'Стандартное время SLA для заявок (часы)',
      is_public: false,
      is_encrypted: false,
    },
    {
      key: 'pin_code_length',
      value: JSON.stringify(4),
      data_type: 'number',
      category: 'security',
      description: 'Длина PIN-кода для входа',
      is_public: false,
      is_encrypted: false,
    },
    {
      key: 'telegram_bot_token',
      value: JSON.stringify('fake_token_for_dev'),
      data_type: 'string',
      category: 'telegram',
      description: 'Токен Telegram бота',
      is_public: false,
      is_encrypted: true,
    },
  ]);

  // 7. Логи активности (пример)
  await knex('activity_logs').insert([
    {
      user_id: users[4].id, // Алексей Кузнецов
      user_role: 'master',
      action_type: 'create',
      entity_type: 'application',
      entity_id: applications[0].id,
      description: 'Создана заявка на приёмку трансформатора',
      ip_address: '192.168.1.100',
      created_at: new Date(now.getTime() - 50 * 60 * 1000), // -50 минут
    },
    {
      user_id: users[2].id, // Мария Сидорова
      user_role: 'inspector',
      action_type: 'assign',
      entity_type: 'application',
      entity_id: applications[1].id,
      description: 'Заявка назначена на проверку',
      ip_address: '192.168.1.101',
      created_at: new Date(now.getTime() - 25 * 60 * 1000), // -25 минут
    },
  ]);

  console.log('✅ Тестовые данные успешно добавлены');
  console.log(`👥 Пользователей: ${users.length}`);
  console.log(`🏭 Участков: ${lots.length}`);
  console.log(`📦 Типов изделий: ${products.length}`);
  console.log(`📝 Заявок: ${applications.length}`);
};