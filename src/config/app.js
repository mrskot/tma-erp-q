require('dotenv').config();

const config = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  
  // Database
  db: {
    host: process.env.DB_HOST || (process.env.NODE_ENV === 'development' ? 'postgres' : 'localhost'),
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'tma_erp_q_dev',
    user: process.env.DB_USER || 'dev_user',
    password: process.env.DB_PASSWORD || 'dev_password',
  },
  
  // File Storage (S3/MinIO)
  s3: {
    endpoint: process.env.S3_ENDPOINT || (process.env.NODE_ENV === 'development' ? 'http://minio:9000' : 'http://localhost:9000'),
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'tma-erp-q-dev',
    region: process.env.S3_REGION || 'us-east-1',
  },
  
  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || 'fake_token_for_dev',
    useFakeAuth: process.env.USE_FAKE_TELEGRAM_AUTH === 'true',
    webAppUrl: process.env.TELEGRAM_WEB_APP_URL || 'http://localhost:3000',
  },
  
  // Bitrix24 (optional)
  bitrix24: {
    webhookUrl: process.env.BITRIX24_WEBHOOK_URL || '',
    authToken: process.env.BITRIX24_AUTH_TOKEN || '',
    useIntegration: process.env.USE_BITRIX24_INTEGRATION === 'true',
  },
  
  // Application Settings
  settings: {
    requirePhotoForApplication: process.env.REQUIRE_PHOTO_FOR_APPLICATION === 'true',
    requirePhotoForDiscrepancy: process.env.REQUIRE_PHOTO_FOR_DISCREPANCY === 'true',
    defaultSlaHours: parseInt(process.env.DEFAULT_SLA_HOURS, 10) || 24,
    pinCodeLength: parseInt(process.env.PIN_CODE_LENGTH, 10) || 4,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logDir: process.env.LOG_DIR || './logs',
  },
  
  // Security
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
};

// Validate required production environment variables
if (config.env === 'production') {
  const required = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'TELEGRAM_BOT_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }
}

module.exports = config;