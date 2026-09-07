export const RATE_LIMITS = {
  AUTH: { limit: 5, ttl: 60000 },
  FILES: { limit: 30, ttl: 60000 },
  NOTES: { limit: 40, ttl: 60000 },
  CLIPBOARD: { limit: 10, ttl: 60000 },
};

export const RATE_LIMIT_MESSAGES = {
  AUTH: 'Слишком много попыток входа. Подождите минуту.',
  FILES: 'Слишком много загрузок. Подождите минуту.',
  NOTES: 'Слишком много заметок. Подождите минуту.',
  CLIPBOARD: 'Слишком много копирований. Подождите минуту.',
  DEFAULT: 'Слишком много запросов. Подождите минуту.',
};

export const MAX_LOGIN_ATTEMPTS = 10;