const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');

/**
 * Middleware for faking Telegram authentication in a development environment.
 * It identifies a user based on request headers or defaults to a predefined admin user,
 * then attaches the user object to the request.
 *
 * This middleware NO LONGER creates users on the fly to avoid database pollution.
 * It relies on the seed data being present.
 */
async function fakeTelegramAuth(req, res, next) {
  // This middleware should only run in development
  if (process.env.NODE_ENV !== 'development' || process.env.USE_FAKE_TELEGRAM_AUTH !== 'true') {
    return next();
  }

  // Allow skipping auth for public routes like login page assets
  if (req.path.startsWith('/public') || req.path.startsWith('/css') || req.path.startsWith('/js')) {
    return next();
  }

  // The default user for development will be the main admin from the seed file.
  const defaultTelegramId = 'admin_123';
  
  // Determine the user to impersonate from headers or use the default.
  const telegramId = req.headers['x-telegram-id'] || defaultTelegramId;

  try {
    const user = await User.findByTelegramId(telegramId);

    if (!user) {
      // CRITICAL CHANGE: Instead of creating a user, we now throw an error.
      // This makes the development environment predictable and depends on seed data.
      // If this error occurs, it means you need to run `npm run db:reset`.
      console.error(`Fake Auth Error: Test user with telegram_id "${telegramId}" not found.`);
      console.error('Please run "npm run db:reset" to seed the database with test users.');
      
      // We pass a more developer-friendly error instead of a generic one.
      return next(new AppError(
        `Тестовый пользователь "${telegramId}" не найден. Выполните 'npm run db:reset'.`,
        500
      ));
    }

    // Attach user object and a flag for traceability
    req.user = user;
    req.isFakeAuth = true;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { fakeTelegramAuth };