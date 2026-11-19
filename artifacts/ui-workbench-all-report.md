# UI Workbench — полный визуальный пакет

Дата: 2026-11-19

## Состав

Для каждой записи каталога Workbench собраны снимки в режимах `Gallery`, `Playground`, `Context`.
Каждая запись проверена в двух темах (`dark`, `light`) и двух размерах (`desktop 1440`, `mobile 375`).

Также отдельно сохранены интерактивные состояния:

- `interaction-button` — focus-visible кнопки;
- `interaction-select` — переход в Playground;
- `interaction-dialog` — открытие диалога;
- `interaction-homework-item` — переключение состояния дедлайна.

## Именование

`<theme>-<viewport>-<component>-<mode>.png`

- `theme`: `dark` или `light`;
- `viewport`: `desktop` или `mobile`;
- `mode`: `gallery`, `playground`, `context`.

## Ограничения

Записи без безопасного preview-adapter сохраняют страницу Workbench с явным статусом `Нет preview`; это не маскируется под готовую демонстрацию.

## Проверки

- реальный DEV Workbench через Chrome CDP;
- смена темы через Inspector/toolbar;
- режимы Gallery / Playground / Context;
- desktop и mobile viewport;
- интерактивные переходы для ключевых компонентов.
