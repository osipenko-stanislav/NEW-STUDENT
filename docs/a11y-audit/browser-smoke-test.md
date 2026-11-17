# Browser smoke test

Дата: 2026-11-17. Это проверка работоспособности диагностического окружения, не полный accessibility-аудит.

## Инструменты

- Node: `v22.16.0`
- Chrome: `Chrome/157.0.8103.79`
- Подключение: Chrome DevTools Protocol по WebSocket через встроенный `WebSocket` Node.js 22.
- URL: `http://127.0.0.1:5173/`

Страница успешно открыта и отрендерила интерактивный Навигатор.

## Computed styles и rectangles

| Элемент | Color | Background | Font | Line-height | Rectangle |
|---|---|---|---|---|---|
| `button.peer/menu-button.flex` (Центральный университет — сбросить сессию) | `rgb(10, 10, 10)` | `rgba(0, 0, 0, 0)` | `14px` | `20px` | `x=16, y=16, 224x48` |
| `button.peer/menu-button.flex` (Навигатор) | `rgb(10, 10, 10)` | `rgba(0, 0, 0, 0)` | `14px` | `20px` | `x=16, y=112, 224x40` |
| `button.flex.h-8` (История) | `rgb(10, 10, 10)` | `rgba(0, 0, 0, 0)` | `14px` | `20px` | `x=39, y=154, 200x40` |
| `button.peer/menu-button.flex` (Мои цели) | `rgb(10, 10, 10)` | `rgba(0, 0, 0, 0)` | `14px` | `20px` | `x=16, y=204, 224x40` |
| `button.peer/menu-button.flex` (Обучение) | `rgb(10, 10, 10)` | `rgba(0, 0, 0, 0)` | `14px` | `20px` | `x=16, y=246, 224x40` |

Все значения получены через `getComputedStyle` и `getBoundingClientRect`.

## Hover

Кнопка: `button.peer/menu-button.flex` — Центральный университет — сбросить сессию.

| Состояние | Color | Background | Box-shadow |
|---|---|---|---|
| default | `rgb(10, 10, 10)` | `rgba(0, 0, 0, 0)` | `none` |
| hover | `rgb(10, 10, 10)` | `rgba(0, 0, 0, 0)` | `none` |

Наведение доставлено через `Input.dispatchMouseEvent`; изменения computed style у выбранной кнопки не обнаружены.

## Keyboard focus

После серии Tab получена последовательность из 7 элементов:

1. `BUTTON` aria-label=`Центральный университет — сбросить сессию`, outline=`rgba(0, 0, 0, 0) solid 2px`, box-shadow=`rgba(255, 255, 255, 0.082) 0px 0px 0px 0px, rgba(10, 10, 10, 0.082) 0px 0px 0px 0.167492px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
2. `BUTTON` aria-label=`Навигатор`, outline=`rgba(0, 0, 0, 0) solid 2px`, box-shadow=`rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
3. `BUTTON` aria-label=``, outline=`rgba(0, 0, 0, 0) solid 2px`, box-shadow=`rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
4. `BUTTON` aria-label=`Мои цели`, outline=`rgba(0, 0, 0, 0) solid 2px`, box-shadow=`rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
5. `BUTTON` aria-label=`Обучение`, outline=`rgba(0, 0, 0, 0) solid 2px`, box-shadow=`rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
6. `BUTTON` aria-label=`Карьера`, outline=`rgba(0, 0, 0, 0) solid 2px`, box-shadow=`rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
7. `BUTTON` aria-label=`Расписание`, outline=`rgba(0, 0, 0, 0) solid 2px`, box-shadow=`rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`

Фокус программно наблюдался через `document.activeElement`; видимость индикатора фиксировалась по outline/box-shadow.

## Dark mode

Открыт раздел «Настройки» → «Внешний вид», выбран режим «Тёмная». После клика `document.documentElement[data-theme]` стал `dark`; sample computed style: color `rgb(245, 245, 245)`, background `rgba(0, 0, 0, 0)`.

## Axe

Axe не запущен: временная установка `npm install --no-save playwright axe-core` в `/tmp/new-student-a11y` не завершилась и пакеты не были разрешены. Это ограничение инструмента, не результат аудита.

## Контрастный расчёт

В диагностическом скрипте реализованы разбор RGB/RGBA, alpha-compositing нескольких слоёв, sRGB relative luminance и WCAG contrast ratio. Для градиентов, изображений и фильтров расчёт по CSS-цветам не считается итоговым измерением.

## Повторный запуск

```sh
# терминал 1
npm run dev -- --host 127.0.0.1
# терминал 2
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless --no-sandbox --disable-gpu --remote-debugging-port=9222 --user-data-dir=/tmp/new-student-chrome-profile-2 about:blank
node docs/a11y-audit/tools/browser-smoke-test.mjs
```
