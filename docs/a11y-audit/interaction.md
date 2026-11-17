# Клавиатура, ARIA, screen reader, targets и motion

## Что подтверждено по исходникам

- Dialog/Sheet/Popover/Select/Dropdown построены на Radix primitives и имеют semantic data slots.
- Icon-only close/delete/copy actions в просмотренных компонентах получают `aria-label` или visible sr-only name.
- Ошибки и часть async/status сообщений используют `role="alert"` или `role="status"`.
- Формы homework и schedule имеют labels/aria-label для основных полей.
- Reduced motion реализован отдельными CSS/JS профилями; статически подтверждается наличие правил, но не полнота каждого сценария.

## Needs manual verification

- Полный Tab/Shift+Tab маршрут: global search, sidebar, conversation history, filter builder, calendar, tables, handbook tree, Status Island, Gen UI.
- Escape/Arrow/Home/End сценарии Radix menus, tabs, select, date picker и dialogs.
- Фактический focus return после закрытия каждого portal.
- Screen reader announcements для Status Island, async save/send, errors, counters, Late Days and generated UI.
- Bounding boxes и расстояния для icon actions, calendar days, grade help, file actions and mobile rows.
- `prefers-reduced-motion`, minimal, balanced и expressive: Bell, counters, tabs, popovers, dialogs, Status Island, Orb.

## Не выполнено

VoiceOver/NVDA и автоматический axe-core audit не запускались. Утверждения об их результатах отсутствуют.

