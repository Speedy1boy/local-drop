export const RATE_LIMITS = {
  GLOBAL: { limit: 500, ttl: 60000 },
  AUTH: { limit: 10, ttl: 60000 },
  FILES: { limit: 10, ttl: 60000 },
  NOTES: { limit: 10, ttl: 60000 },
  CLIPBOARD: { limit: 10, ttl: 60000 },
};

export const RATE_LIMIT_MESSAGES = {
  AUTH: 'Слишком много попыток входа. Подождите минуту.',
  FILES: 'Слишком много загрузок. Подождите минуту.',
  NOTES: 'Слишком много заметок. Подождите минуту.',
  CLIPBOARD: 'Слишком много копирований. Подождите минуту.',
  DEFAULT: 'Слишком много запросов. Подождите минуту.',
};

// Максимальное количество неверных вводов PIN-кода перед баном
export const MAX_LOGIN_ATTEMPTS = 10;

// Лимиты защиты от DDOS и спама (Были захардкожены в фильтре и сервисе)
export const ANTI_SPAM = {
  // Сколько раз Throttler должен выдать ошибку 429 за период, чтобы забанить IP навсегда
  MAX_THROTTLER_ERRORS: 10,
  
  // Время отслеживания спама в миллисекундах
  TRACKER_TTL: 60000, 
  
  // Как часто писать визиты в лог безопасности для одного IP (5 минут)
  VISIT_LOG_INTERVAL: 300000, 
};

// Настройки безопасности сессий (JWT)
export const SECURITY_CONFIG = {
  JWT_EXPIRES_IN: '30d', // Время жизни токена авторизации
} as const;

// Системные настройки сервера
export const SERVER_CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  
  // Лимит на передачу текста/JSON (для буфера обмена)
  BODY_LIMIT: '2mb', 
};