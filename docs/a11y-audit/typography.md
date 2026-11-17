# Типографика, масштабирование и reflow

## Статические наблюдения

- В проекте есть компактные подписи 11–13 px в календаре, виджетах, таблицах, настройках, материалах, истории и status feedback. Сам размер не является автоматическим WCAG-нарушением; читаемость нужно проверить при 200% text resize и обеих темах.
- Основные reading/workspace контейнеры используют ограничения ширины и container queries; статически не найдено основания объявлять нарушение reflow.
- Таблицы ведомостей имеют локальную горизонтальную прокрутку после локального исправления `src/grades.css`; reflow для 400% zoom требует ручного браузерного прогона.

## Needs manual verification

- 200% browser zoom и 400% browser zoom: header, sidebar, tables, Dialog/Sheet, Form controls.
- 200% text resize и настройки `small/default/large`: не обрезаются ли labels, badges, dates, status messages.
- Long course/task/material names: переносы в settings, grades, handbook tree, generated UI and homework.
- Text spacing override: line-height, paragraph spacing, letter/word spacing, focus order after injected spacing.

Подтверждённых типографических нарушений по статическому просмотру нет.

