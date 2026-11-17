# Runtime coverage

Дата: 2026-11-17.

## Инструменты

- Vite уже работал на `127.0.0.1:5173`.
- Chrome найден по пути `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
- `playwright`, `@playwright/test`, `puppeteer`, `selenium-webdriver`, `axe-core` отсутствуют в проекте и временном Node-разрешении.
- Chrome Headless `--dump-dom` и `--screenshot` успешно выполнены.

## Матрица

| Раздел | Light | Dark | 375 | 768 | 1366 | 1440 | Runtime DOM/screenshot |
|---|---:|---:|---:|---:|---:|---:|---|
| Навигатор / Generative UI | да | нет | да | да | да | да | выполнено |
| Каталог курсов | нет | нет | нет | нет | нет | нет | не выполнено |
| Курс / домашка | нет | нет | нет | нет | нет | нет | не выполнено |
| Расписание / ведомости / Late Days | нет | нет | нет | нет | нет | нет | не выполнено |
| Хэндбук / библиотека | нет | нет | нет | нет | нет | нет | не выполнено |
| Уведомления / настройки / Global Search | нет | нет | нет | нет | нет | нет | не выполнено |
| Dialog / Popover / Sheet / Status Island | нет | нет | нет | нет | нет | нет | не выполнено |

## Ограничения

Не заявляются computed-style, alpha-композиция, axe, screen reader, keyboard и focus-runtime проверки. Для полного аудита нужен CDP/Playwright-клиент или ручная проверка в Chrome DevTools с фиксацией каждого состояния.
