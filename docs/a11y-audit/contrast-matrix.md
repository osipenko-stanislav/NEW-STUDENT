# Contrast matrix

## Runtime evidence

Chrome Headless успешно отрендерил стартовый Навигатор в светлой системной теме на ширинах 375, 768, 1366 и 1440 px. Снимки сохранены в `screenshots/navigator-*.png`.

Точные foreground/background пары и WCAG ratio не приводятся: в доступном изолированном запуске не было CDP/Playwright API для чтения `getComputedStyle`, а расчёт по исходным CSS-токенам не заменяет итоговую alpha-композицию.

| Тема | Состояния | Измерено | Результат |
|---|---|---|---|
| Light | default | нет computed-style измерения | Needs manual verification |
| Light | hover/selected/focus | не воспроизведено | Needs manual verification |
| Dark | все | не воспроизведено | Needs manual verification |

Не считать эти пробелы нарушениями WCAG.
