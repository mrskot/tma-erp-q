### 2. Containerized Development
- SQLite для локальной разработки (быстрый старт)
- PostgreSQL в Docker для staging/production
- MinIO для эмуляции S3 хранилища файлов
- Docker Compose для управления локальным стеком
- Nodemon для hot-reload при разработке

### 3. External Production Services
- VPS с уже установленным PostgreSQL 14+
- Внешнее S3-совместимое облачное хранилище
- PM2 для process management
- Nginx как reverse proxy + SSL

### 4. Telegram-Centric UI
- Основной UI — Telegram Mini App
- Веб-админка для администраторов
- Единая кодовая база для обоих интерфейсов
- Mobile-first дизайн

## ТЕХНОЛОГИЧЕСКИЙ СТЕК ПО КОМПОНЕНТАМ

### Backend Core
- **Runtime:** Node.js 18.20.8+
- **Framework:** Express.js 4.18+
- **Database ORM:** Knex.js 2.4+ (query builder + миграции)
- **Database Driver:** SQLite3 (dev), PostgreSQL (prod)
- **Authentication:** JWT + Custom Middleware (PIN-код для входа)

### File Storage
- **Local Dev:** MinIO в Docker (S3-совместимое)
- **Production:** AWS S3 / Yandex Object Storage / Cloudflare R2
- **SDK:** @aws-sdk/client-s3
- **Upload Middleware:** Multer с S3 адаптером

### Telegram Integration
- **Dev Mode:** Fake Telegram Auth Middleware
- **Production:** node-telegram-bot-api + Telegram WebApp SDK
- **Testing:** Telegram Simulator (HTML страница)
- **Notifications:** Telegram Channel + Direct Messages

### Frontend
- **Core:** Vanilla JavaScript ES6+
- **Styling:** CSS3 с Mobile-first подходом
- **HTTP Client:** Fetch API / Axios
- **Telegram SDK:** Telegram WebApp SDK (только в production)
- **Date Handling:** date-fns или day.js

### Infrastructure & Deployment
- **Local Dev:** Docker Compose (MinIO) + SQLite
- **Process Manager:** PM2 (production)
- **Web Server:** Nginx (reverse proxy + SSL)
- **CI/CD:** GitHub Actions
- **Deployment:** SSH-based deployment to VPS
