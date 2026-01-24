# СПРАВОЧНИК API TMA-ERP-Q

## Общая информация

### Базовый URL
```
https://api.your-domain.com/api/v1
```

### Аутентификация
Все защищенные endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <your_jwt_token>
```

### Формат ответов
```json
{
  "success": true,
  "data": { /* данные ответа */ },
  "meta": { /* метаинформация (пагинация, фильтры) */ },
  "error": null
}
```

### Коды статусов HTTP
- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Ошибка валидации
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

## Аутентификация

### Регистрация пользователя
**POST** `/auth/register`

**Описание:** Регистрация нового пользователя в системе.

**Тело запроса:**
```json
{
  "telegram_id": "123456789",
  "username": "ivanov",
  "full_name": "Иванов Иван Иванович",
  "role": "master",
  "password": "secure_password"
}
```

**Параметры:**
- `telegram_id` (string, required): ID пользователя в Telegram
- `username` (string, required): Уникальное имя пользователя
- `full_name` (string, required): Полное имя
- `role` (string, required): Роль (worker/master/inspector/director/admin)
- `password` (string, required): Пароль (мин. 8 символов)

**Ответ:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "telegram_id": "123456789",
      "username": "ivanov",
      "full_name": "Иванов Иван Иванович",
      "role": "master",
      "created_at": "2026-01-18T10:30:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

### Вход в систему
**POST** `/auth/login`

**Описание:** Аутентификация пользователя.

**Тело запроса:**
```json
{
  "username": "ivanov",
  "password": "secure_password"
}
```

**Ответ:** Аналогично регистрации, возвращает пользователя и JWT токен.

### Получение профиля
**GET** `/auth/profile`

**Описание:** Получение информации о текущем пользователе.

**Заголовки:** `Authorization: Bearer <token>`

**Ответ:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "telegram_id": "123456789",
      "username": "ivanov",
      "full_name": "Иванов Иван Иванович",
      "role": "master",
      "created_at": "2026-01-18T10:30:00Z",
      "lots": [
        {
          "id": "lot_uuid",
          "name": "Цех №1",
          "priority": 3,
          "distance": 150
        }
      ]
    }
  }
}
```

## Заявки (Applications)

### Получение списка заявок
**GET** `/applications`

**Описание:** Получение списка заявок с фильтрацией и пагинацией.

**Параметры запроса:**
- `page` (number, optional): Номер страницы (по умолчанию: 1)
- `limit` (number, optional): Количество элементов на странице (по умолчанию: 20, максимум: 100)
- `status` (string, optional): Фильтр по статусу (новая/назначена/в работе/принята/отклонена)
- `lot_id` (string, optional): Фильтр по участку
- `product_id` (string, optional): Фильтр по типу изделия
- `master_id` (string, optional): Фильтр по мастеру
- `inspector_id` (string, optional): Фильтр по контролёру
- `date_from` (string, optional): Дата от (формат: YYYY-MM-DD)
- `date_to` (string, optional): Дата до (формат: YYYY-MM-DD)

**Ответ:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid",
        "lot": {
          "id": "lot_uuid",
          "name": "Цех №1",
          "priority": 3
        },
        "product": {
          "id": "product_uuid",
          "name": "Корпус А",
          "drawing_number": "KD-2024-001"
        },
        "master": {
          "id": "user_uuid",
          "full_name": "Иванов Иван Иванович"
        },
        "inspector": {
          "id": "user_uuid",
          "full_name": "Петров Петр Петрович"
        },
        "status": "в работе",
        "desired_deadline": "2026-01-20T15:00:00Z",
        "created_at": "2026-01-18T10:30:00Z",
        "discrepancies_count": 2
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 145,
      "pages": 8
    },
    "filters": {
      "status": "в работе"
    }
  }
}
```

### Создание заявки
**POST** `/applications`

**Описание:** Создание новой заявки на контроль качества.

**Тело запроса:**
```json
{
  "lot_id": "lot_uuid",
  "product_id": "product_uuid",
  "desired_deadline": "2026-01-20T15:00:00Z",
  "photos": [
    {
      "url": "https://storage.example.com/photo1.jpg",
      "description": "МКИ изделия"
    }
  ],
  "comments": "Срочная проверка требуется"
}
```

**Валидация:**
- Фото обязательны если `REQUIRE_PHOTOS=true` в конфигурации
- `desired_deadline` должен быть в будущем
- Пользователь должен иметь роль `master` или `admin`

**Ответ:** Созданная заявка с полной информацией.

### Получение детальной информации о заявке
**GET** `/applications/{id}`

**Описание:** Получение полной информации о заявке включая связанные данные.

**Параметры пути:**
- `id` (string, required): UUID заявки

**Ответ:**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "uuid",
      "lot": { /* полная информация об участке */ },
      "product": { /* полная информация о продукте */ },
      "master": { /* информация о мастере */ },
      "inspector": { /* информация о контролёре */ },
      "status": "в работе",
      "desired_deadline": "2026-01-20T15:00:00Z",
      "created_at": "2026-01-18T10:30:00Z",
      "photos": [
        {
          "id": "photo_uuid",
          "url": "https://storage.example.com/photo1.jpg",
          "description": "МКИ изделия",
          "created_at": "2026-01-18T10:30:00Z"
        }
      ],
      "discrepancies": [
        {
          "id": "discrepancy_uuid",
          "description": "Трещина на поверхности",
          "status": "открыто",
          "seriousness": "major",
          "responsible": { /* информация об ответственном */ }
        }
      ],
      "checklist_results": [
        {
          "item": "Проверка размеров",
          "result": "passed",
          "comments": "Все размеры в допуске"
        }
      ],
      "activity_log": [
        {
          "action": "created",
          "user": { /* пользователь */ },
          "timestamp": "2026-01-18T10:30:00Z",
          "changes": {}
        }
      ]
    }
  }
}
```

### Обновление статуса заявки
**PATCH** `/applications/{id}/status`

**Описание:** Изменение статуса заявки (только для контролёров и администраторов).

**Тело запроса:**
```json
{
  "status": "принята",
  "comments": "Все проверки пройдены успешно",
  "checklist_results": [
    {
      "item_id": "checklist_item_uuid",
      "result": "passed",
      "comments": "OK"
    }
  ],
  "discrepancy_ids": ["discrepancy_uuid_1", "discrepancy_uuid_2"]
}
```

### Назначение контролёра
**POST** `/applications/{id}/assign`

**Описание:** Назначение контролёра на заявку.

**Тело запроса:**
```json
{
  "inspector_id": "user_uuid"
}
```

## Несоответствия (Discrepancies)

### Получение списка несоответствий
**GET** `/discrepancies`

**Описание:** Получение списка несоответствий с фильтрацией.

**Параметры запроса:**
- `status` (string, optional): Фильтр по статусу (открыто/ожидает/устранено/закрыто)
- `responsible_id` (string, optional): Фильтр по ответственному
- `application_id` (string, optional): Фильтр по заявке
- `seriousness` (string, optional): Фильтр по серьезности (minor/major/critical)
- `closure_scenario` (string, optional): Фильтр по сценарию закрытия

### Создание несоответствия
**POST** `/discrepancies`

**Описание:** Создание нового несоответствия.

**Тело запроса:**
```json
{
  "application_id": "application_uuid",
  "description": "Трещина на поверхности длиной 5см",
  "seriousness": "major",
  "photos": [
    {
      "url": "https://storage.example.com/defect1.jpg",
      "description": "Фото дефекта"
    }
  ],
  "auto_assign": true
}
```

**Примечание:** Если `auto_assign=true`, система автоматически назначит ответственного по правилам.

### Обновление несоответствия
**PATCH** `/discrepancies/{id}`

**Описание:** Обновление информации о несоответствии.

**Тело запроса:**
```json
{
  "description": "Обновленное описание",
  "seriousness": "critical",
  "responsible_id": "new_responsible_uuid"
}
```

### Изменение статуса несоответствия
**POST** `/discrepancies/{id}/status`

**Описание:** Изменение статуса несоответствия.

**Тело запроса:**
```json
{
  "status": "ожидает проверки",
  "comments": "Дефект устранен, требуется проверка",
  "resolution_photos": [
    {
      "url": "https://storage.example.com/fixed1.jpg",
      "description": "Фото исправления"
    }
  ]
}
```

### Закрытие несоответствия
**POST** `/discrepancies/{id}/close`

**Описание:** Закрытие несоответствия по одному из сценариев.

**Тело запроса:**
```json
{
  "closure_scenario": "устранено",
  "closure_comments": "Дефект устранен и проверен",
  "closure_documents": [
    {
      "type": "report",
      "url": "https://storage.example.com/report.pdf",
      "description": "Отчет об устранении"
    }
  ]
}
```

**Доступные сценарии:** `устранено`, `карточка разрешения`, `брак`, `политическое закрытие`

## Участки (Lots)

### Получение списка участков
**GET** `/lots`

**Описание:** Получение списка участков производства.

**Параметры запроса:**
- `active` (boolean, optional): Только активные участки
- `priority` (number, optional): Фильтр по приоритету (1-5)

### Создание участка
**POST** `/lots`

**Описание:** Создание нового участка (только для администраторов).

**Тело запроса:**
```json
{
  "name": "Цех сборки №2",
  "priority": 2,
  "distance": 200,
  "master_id": "master_uuid",
  "backup_master_id": "backup_master_uuid"
}
```

## Типы изделий (Products)

### Получение списка типов изделий
**GET** `/products`

**Описание:** Получение списка типов изделий.

**Параметры запроса:**
- `lot_id` (string, optional): Фильтр по участку
- `active` (boolean, optional): Только активные типы

### Создание типа изделия
**POST** `/products`

**Описание:** Создание нового типа изделия (только для администраторов).

**Тело запроса:**
```json
{
  "name": "Корпус Б",
  "drawing_number": "KD-2024-002",
  "unit": "шт",
  "lot_id": "lot_uuid",
  "checklist": [
    {
      "item": "Проверка размеров",
      "requirement": "Все размеры должны соответствовать чертежу",
      "mandatory": true
    }
  ],
  "inspection_time": 30
}
```

## Пользователи (Users)

### Получение списка пользователей
**GET** `/users`

**Описание:** Получение списка пользователей (только для администраторов).

**Параметры запроса:**
- `role` (string, optional): Фильтр по роли
- `active` (boolean, optional): Только активные пользователи

### Обновление пользователя
**PATCH** `/users/{id}`

**Описание:** Обновление информации о пользователе (только для администраторов).

**Тело запроса:**
```json
{
  "role": "inspector",
  "lots": ["lot_uuid_1", "lot_uuid_2"],
  "is_active": true
}
```

## Отчеты и аналитика

### Получение метрик SLA
**GET** `/reports/sla`

**Описание:** Получение метрик Service Level Agreement.

**Параметры запроса:**
- `date_from` (string, required): Дата начала периода
- `date_to` (string, required): Дата окончания периода
- `lot_id` (string, optional): Фильтр по участку
- `inspector_id` (string, optional): Фильтр по контролёру

**Ответ:**
```json
{
  "success": true,
  "data": {
    "sla_metrics": {
      "total_applications": 145,
      "on_time_applications": 120,
      "on_time_percentage": 82.76,
      "avg_response_time": "2.5h",
      "avg_inspection_time": "4.2h",
      "by_lot": [
        {
          "lot_id": "lot_uuid",
          "lot_name": "Цех №1",
          "on_time_percentage": 85.0,
          "avg_response_time": "2.1h"
        }
      ]
    }
  }
}