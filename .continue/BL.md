🏭 Бизнес-логика и Ролевая модель TMA-ERP-Q
1. Концепция системы
TMA-ERP-Q — это система цифровизации ОТК (Отдела Технического Контроля). Главная цель: уйти от бумажных журналов, ускорить процесс сдачи продукции и накопить базу данных по дефектам для аналитики.
Ключевой объект: Application (Заявка на приёмку). Вокруг неё строится весь процесс.
2. Ролевая модель (Кто и Зачем)
👷‍♂️ Мастер (Master) — "Производитель"
Цель: Сдать продукцию и выполнить план.
Действия:
Создает Application (единичные или партией).
Обязан приложить фото МКИ (Маршрутной Карты) и указать серийные номера.
Получает уведомления о дефектах (Discrepancy).
Назначает рабочих на устранение или устраняет сам.
Может Оспорить (Dispute) решение инспектора, если считает дефект некорректным.
🔍 Инспектор (Inspector) — "Контролёр"
Цель: Не допустить брак на склад.
Действия:
Видит очередь заявок (new / assigned).
Берет заявку в работу (in_progress).
Проходит по Чек-листу (привязан к Product).
Если всё ок -> Accepted.
Если брак -> Создает Discrepancy (Несоответствие) с фото и серьезностью.
Проверяет устранение дефектов и закрывает их.
🎩 Директор по качеству (Director) — "Арбитр"
Цель: Разрешать конфликты и следить за метриками.
Действия:
Вмешивается, если Мастер нажал "Оспорить".
Принимает решения по сложным сценариям закрытия:
Political Decision: Пропустить брак под ответственность руководства.
Scrap: Списать изделие в утиль.
Смотрит глобальную аналитику.
🛠 Рабочий (Worker) — "Исполнитель"
Цель: Устранить конкретный дефект.
Действия:
Видит только назначенные на него Discrepancies.
Отмечает выполнение.
3. Жизненный цикл Заявки (Application Flow)
Создание: Мастер выбирает Участок (Lot) -> Изделие (Product) -> Количество. Создается заявка со статусом NEW.
Назначение: Система (или Админ) назначает Инспектора. Статус -> ASSIGNED.
Проверка: Инспектор открывает заявку. Статус -> IN_PROGRESS.
Результат:
Сценарий А (Идеал): Инспектор не нашел проблем. Нажимает "Принять". Статус -> ACCEPTED.
Сценарий Б (Проблема): Инспектор находит дефект. Создает Discrepancy. Заявка получает статус REJECTED (или висит в IN_PROGRESS до устранения).
4. Режимы контроля (LITE vs HARD)
Это важная настройка в сущности Product (inspection_mode), влияющая на закрытие несоответствий.
🛡️ HARD Mode (Строгий контроль) — По умолчанию
Используется для критически важных изделий (например, трансформаторы).
Инспектор находит дефект.
Мастер устраняет и жмет "Исправлено" (прикладывает фото). Статус дефекта -> RESOLVED.
Важно: Дефект НЕ закрывается. Инспектор должен лично прийти, проверить и нажать "Закрыть". Только тогда статус -> CLOSED.
🚀 LITE Mode (Доверительный контроль)
Используется для простых деталей (болты, гайки) или доверенных участков.
Инспектор находит дефект.
Мастер устраняет и жмет "Исправлено".
Автоматизация: Система сразу переводит дефект в CLOSED, доверяя Мастеру. Инспектору не нужно перепроверять.
5. Сценарии закрытия Несоответствия
В коде (discrepancyService.js) реализована логика closure_scenario:
Fixed (Устранено): Стандартный путь. Починили -> Закрыли.
Resolution Card (КР): Дефект неустраним, но изделие функционально. Оформляется "Карточка Разрешения" (бумажный документ), его номер вносится в систему.
Scrap (Брак): Изделие нельзя починить. Оно списывается.
Political (Политическое): "Срочно нужно отгружать, клиент ждет, закройте глаза". Требует высокого уровня доступа.
6. Технические особенности бизнес-логики
Привязка Мастеров: Мастер жестко привязан к Участкам (Lot). Он не видит чужие участки.
Ghost Listeners Fix: Во фронтенде реализован механизм полной замены контейнера страницы при навигации, чтобы избежать дублирования кликов по кнопкам в модальных окнах.
Activity Log: Любое изменение статуса или создание сущности пишется в лог для разбора полетов ("Кто принял брак?").


РЕФАКТОРИНГ - всю логику нужно восстанавливать!

Дата обновления: 22.01.2026
Статус: Рефакторинг завершен, базовый функционал восстановлен.
1. Обзор архитектуры
Проект представляет собой Telegram Mini App (ERP) для управления качеством на производстве.
Архитектура разделена на Backend API (Node.js) и Frontend SPA (Vanilla JS + ES Modules).
🛠 Технологический стек
Backend: Node.js, Express, Knex.js, SQLite (Dev) / PostgreSQL (Prod).
Frontend: HTML5, CSS3, Vanilla JS (ES6 Modules).
Auth: JWT + Custom Telegram Auth (Fake Auth for Dev).
2. Структура Фронтенда (SPA Architecture)
Фронтенд был переписан с монолитных скриптов на модульную архитектуру.
Ключевые модули (public/js/):
app.js (Core):
Точка входа.
Инициализирует Router (хэш-навигация).
Создает Single Instances всех модальных окон (this.modals).
Критическая логика: При смене страницы делает cloneNode(false) контейнера #page-content, чтобы удалить старые Event Listeners ("Ghost Listeners fix").
api.js (Network):
Обертка над fetch.
Автоматически добавляет JWT токен.
Экспортируется как default Singleton.
auth.js (Security):
Управляет токенами и состоянием пользователя (store).
Экспортируется как default Singleton.
components/ (UI):
BaseModal.js: Родительский класс для всех модалок.
UserModal, LotModal, ApplicationModal и др. наследуются от него.
Используют App.js для передачи колбэков onSave.
pages/ (Controllers):
users.js, lots.js, applications.js и т.д.
Экспортируют функцию init(container, modals).
Отвечают за рендеринг HTML и привязку событий только для текущей страницы.
🔄 Схема взаимодействия (Frontend Flow)
code
Mermaid
graph TD
    User(User Interaction) --> App[app.js / Router]
    
    subgraph Initialization
    App --> Auth[auth.js]
    App --> Modals[Instantiate All Modals]
    end
    
    subgraph Navigation
    App -- 1. Clear Events (cloneNode) --> Content[#page-content]
    App -- 2. Call init(container, modals) --> Page[pages/*.js]
    end
    
    subgraph Page Logic
    Page -- Render Data --> Content
    Page -- Click 'Create' --> Modals
    Page -- Fetch Data --> API[api.js]
    end
    
    subgraph Modals
    Modals -- Submit Form --> API
    Modals -- onSave Callback --> Page
    end
    
    API -- REST Requests --> Backend[Node.js API]
3. Структура Бэкенда
Стандартный MVC с выделенным слоем сервисов.
Controllers (src/controllers): Принимают запрос, валидируют (express-validator), вызывают сервис, отправляют ответ. Используют asyncHandler.
Services (src/services): Вся бизнес-логика. Работа с БД через модели. Логирование через activityLogService.
Models (src/models): Обертки над Knex Query Builder.
Middleware: auth.js (JWT), rbacMiddleware (роли), fakeTelegramAuth (Dev).
4. История изменений (Что было сделано)
✅ Исправленные проблемы (Refactoring Log)
Backend Startup: Исправлен двойной запуск сервера и конфликт портов (EADDRINUSE) в server.js.
Broken Services: Восстановлен и дописан discrepancyService.js, который вызывал краш при старте.
Frontend Imports: Унифицированы экспорты в api.js и auth.js (переход на export default), исправлены ошибки does not provide an export named....
Missing UI: Добавлен недостающий HTML-код для модалок (Application, Discrepancy) в index.html.
Ghost Listeners: Исправлена проблема наложения модальных окон при переходе между страницами (Пользователи -> Участки) путем полной замены DOM-узла контейнера в app.js.
5. Задачи для следующего этапа (Backlog)
Backend Architecture: Внедрить BaseModel.js для устранения дублирования кода CRUD операций в моделях (DRY).
Business Logic: Реализовать логику жизненного цикла Несоответствий (Discrepancies):
Создание из заявки.
Сценарии закрытия (Мастер устраняет -> Инспектор принимает).
Frontend Polish:
Улучшить UX фильтров.
Добавить индикацию загрузки при сохранении форм.
Команды для запуска
code
Bash
# Запуск в режиме разработки
npm run dev

# Очистка базы (если нужно)
npm run db:reset

📋 План Рефакторинга и Реализации Бизнес-Логики TMA-ERP-Q
Роль: Senior Fullstack Developer
Контекст: Проект восстановлен после сбоя. Архитектура: Node.js (MVC) + Vanilla JS (SPA).
Цель: Устранить дублирование кода (DRY), реализовать полный цикл работы с Несоответствиями и отполировать UI.
🏗️ ФАЗА 1: Архитектурный Рефакторинг Бэкенда (DRY & DAL)
Проблема: В моделях (User.js, Lot.js, Product.js) много повторяющегося кода (CRUD, пагинация, soft delete).
Задача: Внедрить паттерн BaseModel.
Шаг 1.1: Создание BaseModel
Файл: src/models/BaseModel.js
Задача: Создать класс, принимающий имя таблицы в конструкторе.
Методы к реализации:
findAll({ limit, offset, filters, sort }): Стандартная выборка с пагинацией.
findById(id): Поиск по ID с учетом is_active = true.
create(data): Вставка + возврат созданного объекта.
update(id, data): Обновление updated_at + данных.
delete(id): Soft delete (установка is_active = false).
count(filters): Подсчет записей.
Шаг 1.2: Рефакторинг Сущностей
Файлы: src/models/User.js, src/models/Lot.js, src/models/Product.js.
Задача:
Наследовать их от BaseModel.
Удалить дублирующиеся методы CRUD.
Оставить только специфичные методы (например, findByTelegramId в User или findByCode в Lot).
Критерий успеха: API /users, /lots, /products продолжают работать идентично, но код моделей сократился в 2 раза.
⚙️ ФАЗА 2: Реализация Бизнес-Логики Несоответствий (Core Logic)
Проблема: Сервис есть, но UI не позволяет полноценно пройти цикл LITE/HARD режимов и закрытия.
Шаг 2.1: Связка Заявка -> Несоответствие
Файл: public/js/components/ApplicationDetailsModal.js
Задача:
При клике на "Выявить несоответствие":
Открывать DiscrepancyModal.
Важно: Автоматически передавать application_id, product_id и inspector_id в форму создания.
После сохранения обновлять список несоответствий внутри модалки заявки (без перезагрузки страницы).
Шаг 2.2: Интерфейс Мастера (Устранение)
Файл: public/js/components/DiscrepancyModal.js
Задача:
Если юзер = Master и статус = assigned/in_progress:
Показывать кнопку "🛠️ Устранено".
При нажатии требовать заполнения поля fix_photo_url (если режим HARD).
Реализовать кнопку "⚖️ Оспорить" -> открывает поле для ввода special_opinion.
Шаг 2.3: Интерфейс Инспектора (Закрытие)
Файл: public/js/components/DiscrepancyModal.js
Задача:
Если юзер = Inspector:
Показывать блок "Решение контролера".
Селект Сценарий закрытия (Fixed, КР, Scrap, Political).
Кнопка "✅ Закрыть" (перевод в closed).
Кнопка "❌ Вернуть в работу" (перевод в in_progress).
🎨 ФАЗА 3: Улучшение UX (Frontend Polish)
Проблема: Пользователю непонятно, что происходит (нет лоадеров, фильтры сбрасываются).
Шаг 3.1: Индикация загрузки
Файл: public/js/api.js или app.js
Задача:
Внедрить глобальный перехватчик запросов.
Показывать спиннер (#loading-screen или мини-лоадер) при любом fetch запросе.
Скрывать после завершения.
Шаг 3.2: Умные фильтры
Файлы: public/js/pages/*.js
Задача:
Сохранять состояние фильтров (статус, участок) в store.js или localStorage.
При возврате на страницу (например, из модалки) восстанавливать выбранные фильтры.
Шаг 3.3: Валидация форм
Файлы: Все *Modal.js.
Задача:
Перед отправкой проверять обязательные поля.
Подсвечивать красным пустые input.
Проверять, что дата не в прошлом (для desired_inspection_time).
🛡️ ФАЗА 4: Тестирование и Безопасность (Hardening)
Шаг 4.1: Проверка прав на Бэкенде
Файлы: src/routes/*.js
Задача: Пройтись по всем роутам и убедиться, что везде стоит rbacMiddleware с правильным набором ролей (как описано в "Ролевой модели").
Пример: DELETE /users/:id только для admin.
Пример: PATCH /discrepancies/:id/status для inspector, master, director.
Шаг 4.2: Санитизация данных
Файлы: Контроллеры.
Задача: Убедиться, что express-validator используется везде. Добавить .escape() для текстовых полей, чтобы предотвратить XSS через имена пользователей или описания дефектов.
🚀 Порядок выполнения для Агента:
Выполни Фазу 1 (BaseModel). Это фундамент. Без этого код будет грязным.
Выполни Шаг 2.1 и 2.2. Это даст возможность Мастеру отчитываться о работе.
Выполни Шаг 2.3. Это замкнет цикл качества.
Остальное (UX и Security) — по остаточному принципу.

Вот План действий (Roadmap) на ближайшее время, разбитый на логические блоки для Агента.
🎯 Этап 4: Реализация рабочих мест (Dashboards)
Сейчас Дашборд — это просто цифры для админа. Мастер и Инспектор видят пустоту. Это нужно исправить в первую очередь.
Задача 4.1: Дашборд Мастера (pages/dashboard.js)
Логика: Мастер должен видеть две главные вещи:
"Мои активные дефекты" (Discrepancies со статусом assigned / in_progress / rejected, где он responsible_id). Это его "To-Do лист".
"Мои последние заявки" (Applications, созданные им, чтобы видеть статус).
UI: Использовать карточки (UI.createDiscrepancyCard, UI.createApplicationCard).
Действие: Клик по дефекту -> открытие модалки устранения.
Задача 4.2: Дашборд Инспектора (pages/dashboard.js)
Логика:
"Очередь на проверку" (Applications со статусом new или assigned на него).
"Проверка устранения" (Discrepancies со статусом resolved - то, что мастера починили).
UI: Карточки с яркими бейджами статусов.
📱 Этап 5: "Причесывание" UI и Telegram Integration
Сейчас интерфейс "веб-ориентированный". Нужно сделать его удобным для пальца (Mobile First).
Задача 5.1: Адаптация под Telegram WebApp
Кнопки: Убрать кнопку "Сохранить" внутри форм. Использовать Telegram.WebApp.MainButton (синяя кнопка внизу экрана).
Логика: При открытии модалки -> MainButton.show(). При нажатии на неё -> сабмит формы. При закрытии -> MainButton.hide().
Цвета: Использовать CSS-переменные Telegram (var(--tg-theme-bg-color) и т.д.), чтобы тема (темная/светлая) совпадала с клиентом пользователя.
Задача 5.2: Улучшение карточек
Добавить визуальные индикаторы SLA (например, красная рамка, если срок вышел).
Сделать карточки более компактными (меньше отступы, крупнее текст статуса).
📸 Этап 6: Работа с файлами (Фотографии)
В формах сейчас текстовые поля для URL. Это неудобно.
Задача 6.1: Загрузка фото (Frontend Mock)
Вместо input type="text" сделать кнопку "📷 Сделать фото" (или загрузить).
Пока нет S3, реализовать простую логику:
Пользователь выбирает файл.
(Временное решение) Мы не грузим его на сервер, а просто ставим заглушку или (если сервер позволяет) реализуем базовый multer загрузчик в локальную папку public/uploads.
📝 Инструкция для Агента (Copy-Paste)
Можешь отправить это агенту как следующее задание:
code
Markdown
# ЗАДАНИЕ: Реализация Дашбордов для Мастера и Инспектора

**Цель:** Сделать главную страницу (`dashboard.js`) функциональной для рабочих ролей, а не только для админа.

**Контекст:**
*   В `store.js` есть `currentUser`.
*   API методы `api.getApplications` и `api.getDiscrepancies` поддерживают фильтрацию.
*   Компоненты карточек `UI.create...` уже готовы.

**Шаги выполнения:**

1.  **Модифицируй `public/js/pages/dashboard.js`**:
    *   В функции `init`, проверь роль `store.state.currentUser.role`.
    *   Если роль **Master**:
        *   Запроси `api.getDiscrepancies({ responsible_id: user.id, status: 'assigned,in_progress,rejected' })`.
        *   Запроси `api.getApplications({ master_id: user.id, limit: 5 })`.
        *   Отрендери две секции: "🛠 Требует внимания (Дефекты)" и "📋 Мои последние заявки".
    *   Если роль **Inspector**:
        *   Запроси `api.getApplications({ status: 'new,assigned,in_progress' })` (где inspector_id = null или me).
        *   Запроси `api.getDiscrepancies({ status: 'resolved' })` (на проверку).
        *   Отрендери секции: "🔍 Заявки на проверку" и "✅ Проверить устранение".

2.  **Улучшение UI**:
    *   Если списки пусты, показывай красивую заглушку "Задач нет 🙌".
    *   Добавь кнопку "Обновить" (pull-to-refresh аналог) в заголовок.

3.  **Тестирование**:
    *   Зайди под Мастером (1111) -> должен видеть свои заявки.
    *   Зайди под Инспектором (7890) -> должен видеть новые заявки.
Начинай с Дашбордов. Это сразу даст ощущение "живой" системы.

Последнее на чём закончили стили
public/css/style.css
:root {
+    --bg-color: #f4f4f5;
+    --card-bg: #ffffff;
+    --text-main: #18181b;
+    --text-muted: #71717a;
+    --accent: #2563eb;
+    --accent-soft: #eff6ff;
+    --danger: #dc2626;
+    --danger-soft: #fef2f2;
+    --success: #16a34a;
+    --success-soft: #f0fdf4;
+    --border: rgba(0,0,0,0.08);
+}
+
 body {
-    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
+    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
     margin: 0;
-    background-color: var(--tg-theme-bg-color, #f0f2f5);
-    color: var(--tg-theme-text-color, #222);
+    background-color: var(--tg-theme-bg-color, var(--bg-color));
+    color: var(--tg-theme-text-color, var(--text-main));
+    -webkit-font-smoothing: antialiased;
 }
 
 .container {
-    padding: 20px;
-    max-width: 900px;
+    padding: 16px;
+    max-width: 600px;
     margin: 0 auto;
 }
 
-.hidden {
-    display: none !important;
+#page-content {
+    background: transparent;
+    border-radius: 0;
+    padding: 0;
+    margin-top: 10px;
+    box-shadow: none;
 }
 
-.button {
-    display: inline-block;
-    width: 100%;
-    padding: 12px 20px;
-    font-size: 16px;
-    font-weight: 600;
-    text-align: center;
-    border: none;
-    border-radius: 8px;
-    cursor: pointer;
-    background-color: var(--tg-theme-button-color, #2481cc);
-    color: var(--tg-theme-button-text-color, #ffffff);
-    transition: background-color 0.2s ease;
-}
-
-.button:disabled {
-    background-color: #a0a0a0;
-    cursor: not-allowed;
-}
-
-.button-secondary {
-    background-color: #a0a0a0;
-    color: white;
-}
-
-/* Экран входа */
-#login-screen .container {
-    max-width: 400px;
-    text-align: center;
-    position: absolute;
-    top: 40%;
-    left: 50%;
-    transform: translate(-50%, -50%);
-}
-
-#login-screen h1 {
-    font-size: 24px;
-    margin-bottom: 10px;
-}
-
-#login-screen p {
-    color: #666;
-    margin-bottom: 30px;
-}
-
-#pin-input {
-    width: 100%;
-    max-width: 200px;
-    margin: 0 auto 20px;
-    padding: 15px;
-    font-size: 28px;
-    text-align: center;
-    letter-spacing: 1.5em; /* Расстояние между символами */
-    border: 1px solid #ccc;
-    border-radius: 8px;
-    box-sizing: border-box;
-}
-
-.error-message {
-    color: var(--tg-theme-destructive-text-color, #e53935);
-    margin-top: 15px;
-    height: 20px;
-}
-
-
-/* Основное приложение */
-#main-app {
+/* Карточки для мобильных устройств (улучшенные) */
+.mobile-card {
+    background: var(--tg-theme-secondary-bg-color, var(--card-bg));
+    border-radius: 20px;
+    padding: 20px;
+    margin-bottom: 16px;
+    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
     display: flex;
     flex-direction: column;
-    min-height: 100vh;
+    gap: 12px;
+    border: 1px solid var(--border);
+    transition: transform 0.2s ease;
 }
 
-header {
-    background-color: var(--tg-theme-secondary-bg-color, #fff);
-    border-bottom: 1px solid #e0e0e0;
-    padding: 0 20px;
+.mobile-card:active {
+    transform: scale(0.98);
 }
 
-header .container {
-    display: flex;
-    justify-content: space-between;
-    align-items: center;
-    height: 60px;
-    padding: 0;
+.mobile-card.inactive {
+    opacity: 0.5;
+    filter: grayscale(1);
 }
 
-header h1 {
-    font-size: 20px;
-    margin: 0;
-}
-
-#user-info {
-    color: #666;
-    font-size: 14px;
-}
-
-nav {
-    background-color: var(--tg-theme-secondary-bg-color, #fff);
-    border-bottom: 1px solid #e0e0e0;
-}
-
-nav .container {
+.mobile-card .card-header {
     display: flex;
-    gap: 20px;
-    padding: 0;
-}
-
-nav a {
-    padding: 15px 10px;
-    text-decoration: none;
-    color: var(--tg-theme-link-color, #2481cc);
-    font-weight: 500;
-    border-bottom: 3px solid transparent;
-    transition: border-color 0.2s ease, color 0.2s ease;
-}
-
-nav a.active {
-    color: var(--tg-theme-text-color, #222);
-    border-bottom-color: var(--tg-theme-button-color, #2481cc);
-}
-
-main {
-    flex-grow: 1;
-    background-color: var(--tg-theme-bg-color, #f0f2f5);
-}
-
-#page-content {
-    background: var(--tg-theme-secondary-bg-color, #fff);
-    border-radius: 10px;
-    padding: 20px;
-    margin-top: 20px;
-    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
-}
-
-/* Стили для CRUD-страниц */
-.page-header {
-    display: flex;
     justify-content: space-between;
     align-items: center;
-    margin-bottom: 20px;
 }
 
-.page-header h3 {
-    margin: 0;
-    font-size: 20px;
+.mobile-card .card-id {
+    font-size: 10px;
+    color: var(--text-muted);
+    font-weight: 700;
+    letter-spacing: 0.5px;
 }
 
-.page-header .button {
-    width: auto;
+.mobile-card .card-main-info {
+    font-size: 20px;
+    font-weight: 800;
+    color: var(--text-main);
+    line-height: 1.2;
 }
 
-/* Карточки для мобильных устройств (вместо таблиц) */
-.mobile-card {
-    background: #fff;
-    border-radius: 12px;
-    padding: 15px;
-    margin-bottom: 12px;
-    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
+.mobile-card .card-sub-info {
+    font-size: 14px;
+    color: var(--text-muted);
     display: flex;
     flex-direction: column;
-    gap: 10px;
-    position: relative;
-    border-left: 4px solid var(--tg-theme-button-color, #2481cc);
-}
-
-.mobile-card.inactive {
-    border-left-color: #ccc;
-    opacity: 0.8;
-}
-
-.mobile-card .card-row {
-    display: flex;
-    justify-content: space-between;
-    align-items: baseline;
-}
-
-.mobile-card .card-label {
-    font-size: 12px;
-    color: #888;
+    gap: 4px;
     font-weight: 500;
 }
 
-.mobile-card .card-value {
-    font-size: 14px;
-    font-weight: 600;
-    color: #333;
-}
-
 .mobile-card .card-actions {
     display: flex;
-    justify-content: flex-end;
     gap: 12px;
-    margin-top: 5px;
-    padding-top: 10px;
-    border-top: 1px solid #f0f0f0;
+    margin-top: 8px;
+    padding-top: 16px;
+    border-top: 1px solid var(--border);
 }
 
-.mobile-card .button-icon {
-    background: none;
+.mobile-card .button-action {
+    flex: 1;
+    padding: 14px;
+    border-radius: 14px;
+    font-size: 15px;
+    font-weight: 700;
     border: none;
-    padding: 8px;
-    font-size: 18px;
     cursor: pointer;
-    border-radius: 6px;
-    transition: background 0.2s;
+    display: flex;
+    align-items: center;
+    justify-content: center;
+    gap: 8px;
 }
 
-.mobile-card .button-icon:hover {
-    background: #f5f5f5;
+.mobile-card .btn-edit {
+    background: var(--accent-soft);
+    color: var(--accent);
 }
 
-.mobile-card .button-icon.edit { color: #2481cc; }
-.mobile-card .button-icon.delete { color: #e53935; }
-.mobile-card .button-icon.restore { color: #28a745; }
+.mobile-card .btn-delete {
+    background: var(--danger-soft);
+    color: var(--danger);
+}
-/* Grid layout для дашбордов и списков */
-.task-grid {
-    display: flex;
-    flex-direction: column;
-    gap: 10px;
+.mobile-card .btn-restore {
+    background: var(--success-soft);
+    color: var(--success);
 }
 
-.dashboard-section h4 {
-    margin: 20px 0 10px;
-    font-size: 16px;
-    color: #666;
-    text-transform: uppercase;
-    letter-spacing: 0.5px;
-}
+.status-badge {
+    padding: 4px 10px;
+    border-radius: 8px;
+    font-size: 11px;
+    font-weight: 800;
+    letter-spacing: 0.3px;
+}