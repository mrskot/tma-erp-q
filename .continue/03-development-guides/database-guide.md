ЗАГОЛОВОК: ЭТАЛОННАЯ СТРУКТУРА ТАБЛИЦЫ USERS (Knex.js)

## Текущий статус БД
- **СУБД:** SQLite (используется для разработки)
- **Управление:** Knex.js
- **Миграции:** 8 миграций уже выполнено (созданы таблицы users, lots, products, applications, discrepancies, system_config, audit_logs)
- **Тестовые данные:** Загружены через seed-файлы

## Схема данных (Users)
- `id`: bigIncrements
- `telegram_id`: string (уникальный)
- `username`, `first_name`, `last_name`: string
- `pin_code`: string (hashed)
- `role`: enum (worker, master, otk_inspector, admin, quality_director, super_admin)
- `is_active`: boolean (default: true)
- `bitrix24_id`: integer (unique)

Описание полей:

id: bigIncrements, Первичный ключ.

telegram_id: string(50), Уникальный, Индексируемый.

Данные из TG: username, first_name, last_name.

Безопасность: pin_code (4 знака), password_hash.

Роли (Enum): worker, master, otk_inspector, admin, super_admin, quality_director. (По умолчанию: worker).

Дополнительно: is_active (boolean), permissions (jsonb), bitrix24_id (integer, уникальный).

Связи: created_by_user_id (ссылка на id этой же таблицы).

Принципы:

Используем JSONB для гибких разрешений (permissions).

Все индексы (telegram_id, role, is_active) обязательны для производительности.

Тип для telegram_id — string (в Knex), что соответствует хранению больших чисел.