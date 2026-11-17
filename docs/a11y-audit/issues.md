# Реестр проблем

## Подтверждённые нарушения

Подтверждённых нарушений WCAG 2.2 AA по доступным доказательствам нет.

## Пункты для ручной проверки

### A11Y-001

- Severity: Medium
- Confidence: Needs manual verification
- Screen: все экраны с hover/focus/selected состояниями
- Component: семантические цвета и полупрозрачные слои
- File and line: `src/styles/tokens.css:13-68`, `src/semantic-colors.css:3-71`, локальные `:hover` правила
- WCAG: 1.4.3, 1.4.11
- Reproduction: открыть Light и Dark, проверить текст/иконки/границы на `muted`, `accent`, soft semantic backgrounds, hover и selected состояниях.
- Actual behavior: CSS задаёт цвета и прозрачность, но без computed browser values нельзя доказать итоговый контраст после альфа-композитинга.
- Expected behavior: обычный текст ≥4.5:1, крупный ≥3:1, значимые границы и focus indicators ≥3:1.
- Evidence: статические токены; runtime-контраст не снят.
- Proposed direction: снять computed colors и измерить пары в браузере; исправлять только подтверждённые пары.
- Regression risk: затрагивает семантические статусы и темы.

### A11Y-002

- Severity: Medium
- Confidence: Needs manual verification
- Screen: Dialog, Sheet, Popover, Select, Dropdown, Calendar
- Component: портальные поверхности и фокус
- File and line: `src/styles/components.css:21-24`, `src/styles/components.css:157-163`, `src/styles/components.css:191`, `src/components/ui/dialog.tsx:35-50`
- WCAG: 2.4.7, 2.4.11, 2.1.2
- Reproduction: открыть каждый overlay клавиатурой, пройти Tab/Shift+Tab, закрыть Escape и проверить возврат фокуса; проверить focus ring у полей внутри scrollable surface.
- Actual behavior: правила focus-visible и Radix primitives присутствуют, но фактическая видимость, отсутствие перекрытия и возврат фокуса не проверены в браузере.
- Expected behavior: фокус видим, не скрыт overlay/scroll edge, ловушка отсутствует, фокус возвращается к trigger.
- Evidence: DOM/CSS inspection only.
- Proposed direction: выполнить ручной сценарий и axe/focus audit; код менять только после воспроизведения.
- Regression risk: общий overlay behavior.

### A11Y-003

- Severity: Low
- Confidence: Needs manual verification
- Screen: все мобильные и touch-сценарии
- Component: compact controls and icon actions
- File and line: `src/styles/components.css:8-24`, `src/styles/components.css:157-173`, `src/styles/settings.css:39-43`, `src/grades.css:47-50`
- WCAG: 2.5.8
- Reproduction: измерить bounding boxes icon buttons, calendar days, close buttons, grade help, delete/copy controls на 375 px.
- Actual behavior: часть controls явно 32–40 px; WCAG 2.2 minimum 24 px может выполняться, но расстояния между соседними target и реальная hit area не измерены.
- Expected behavior: target ≥24×24 CSS px либо выполнено одно из исключений; touch UX по возможности ≥44×44.
- Evidence: CSS dimensions, без DOM bounding boxes.
- Proposed direction: снять реальные rectangles и проверить spacing/exceptions.
- Regression risk: мобильная плотность и таблицы.

