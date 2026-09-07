# Local Drop | Frontend

SPA-клиент для файлообменника, написанный на Angular с использованием современных подходов фреймворка (Signals, Standalone-компоненты, Control Flow).

## Особенности реализации
- **UI-кит:** Angular Material 3 с кастомной светлой/тёмной темой.
- **Состояние:** Полностью на Angular Signals (без NgRx/Redux).
- **Drag-and-Drop:** Кастомная реализация через нативные HTML5 API (без тяжёлых библиотек).
- **Real-time:** Синхронизация с бэкендом через Socket.io (файлы, буфер обмена, заметки).
- **Просмотрщик:** Полноэкранный viewer для фото и видео с Container Queries.
- **Сеть:** Динамическое определение адреса API через `window.location.hostname` — работает в любой локальной сети без перенастройки.

## Локальный запуск

Рекомендуется запускать клиент через корневой скрипт монорепозитория, чтобы корректно подтягивались общие типы из `@local-drop/shared`.

### Режим разработки (hot-reload):
```bash
npm run front
```
Клиент запустится на `http://localhost:4200` и будет доступен по вашему IP в локальной сети (например, `http://192.168.1.15:4200`).

### Production-сборка:
```bash
npm run build:front
```
Скомпилированные файлы будут находиться в `frontend/dist/frontend/browser/`.

## Конфигурация сети

Адрес бэкенда определяется автоматически в файле `src/app/config.ts`:
```typescript
export const API_URL = `http://${window.location.hostname}:3000`;
```

Это означает, что:
- При открытии сайта через `localhost` запросы к API идут на `localhost:3000`.
- При открытии через IP в ZeroTier (например, `10.26.209.11`) запросы автоматически идут на `10.26.209.11:3000`.

Никаких ручных настроек при смене сети не требуется.

## Структура
```
frontend/src/app/
├── components/        # UI-компоненты (clipboard, files, notes, login, admin)
├── services/          # Сервисы (auth, files, clipboard, notes, theme)
├── interceptors/      # HTTP-интерсепторы (авторизация, обработка ошибок)
├── directives/        # Директивы (drag-and-drop)
├── config.ts          # Конфигурация API-адреса
└── app.routes.ts      # Маршрутизация
```