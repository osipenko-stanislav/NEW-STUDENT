# NEW STUDENT interface system

The current visual language is the project's Cupertino adaptation, using the existing NEW STUDENT palette, PT Root UI and selective Universita accents. Product behavior and student-facing content are governed by AGENTS.md. This document describes the implemented system and where changes belong.

## Ownership

`src/main.tsx` imports **only `src/index.css`**. That file is the ordered stylesheet manifest; add imports there rather than adding another override entry to the application.

| Responsibility | Source of truth |
| --- | --- |
| Light/dark palette, fonts, radii, elevation | `src/styles/tokens.css` |
| Semantic status and file colors | `src/semantic-colors.css` |
| Fonts, browser defaults, selection, caret, scrollbars | `src/styles/base.css` |
| Shared control and surface appearance | `src/styles/components.css` |
| Explicit content typography | `src/styles/typography.css` |
| Motion values shared by CSS and React | `src/lib/motion-tokens.ts` |
| Shared transitions, entrances, reduced-motion rules | `src/styles/motion.css` |
| Stable header and workspace geometry | `src/styles/shell.css` |
| Desktop, collapsed and mobile navigation | `src/styles/navigation.css` |
| Chat, composer and generated response composition | `src/styles/chat.css` |
| Widgets and library/file composition | `src/styles/widgets.css`, `src/styles/materials.css` |
| Page gutters, widths and hierarchical navigation | `src/page-layout.css` |
| Feature-specific composition | `src/settings.css`, `src/courses.css`, `src/grades.css`, `src/study-pages.css`, `src/global-search.css` |
| Handbook reading composition, loaded with its route | `src/handbook.css` |

The former `cupertino.css` override layer has been removed. Its component rules now live in the shared system and its feature-specific rules live alongside the layouts they modify. Do not recreate a final stylesheet that patches all preceding files.

## Component contracts

Use `src/components/ui` before adding a component. Primitives own behavior, accessibility and semantic `data-slot` hooks; shared CSS owns their appearance. Feature classes own composition, not a second implementation of the same control.

- **Button/Input/Select/Switch/RadioGroup** retain their semantic variants and accessible names. Customize a control in the primitive or shared stylesheet so every instance receives the change.
- **TabsList** and **SegmentedControl** use the same segmented surface. Tabs retain Radix tab navigation. Independent filters use actual buttons with `aria-pressed`; theme choices retain RadioGroup semantics. Long groups scroll in one row. Calendar day grids preserve their distinct composition.
- **Dialog/Sheet/Popover/DropdownMenu/Tooltip** have stable slots and shared elevation/motion. Their portal content must not depend on being a descendant of `.student-app`.
- **EmptyState** is shared by course recordings, grades, homework and schedule. Pass the icon, title, description and optional recovery action. Compact inline chat messages stay inline; do not turn them into full empty-state panels.
- **Card** represents an independent entity or grouped interactive surface. Tables, reading content, chat answers and file previews do not acquire extra cards for consistency.

Use semantic tokens such as `--radius-control`, `--radius-surface`, `--shadow-popover`, `--font-ui`, `--color-blue-text`. An existing reference-specific illustration or semantic accent is not a reason to introduce a new palette.

## Typography

PT Root UI is the default for the entire application, including system headings, navigation, controls, settings, dialogs, search, generated response headings, tables and compact labels.

Universita is opt-in through `data-typography="accent-title"`. Its current uses are the Navigator greeting, course/lesson and handbook article titles, major content section headings (`h2`), and the weather banner accent. Subheadings (`h3` and smaller) stay in the UI font. Never assign Universita globally to heading tags or whole containers.

Font families are defined as tokens. Feature styles choose size and layout; they do not choose another font family. Keep text scaling and narrow layouts working without shrinking content accents into small labels.

## Motion

`motion-tokens.ts` defines the 1.5 duration multiplier, intensity profiles, easing and scaled springs. AppMotionProvider publishes CSS properties before paint and provides the same transition profile to Motion components. System reduced-motion preferences retain their existing priority.

Primitives use `ui-motion-control` or `ui-motion-layout`; surface entrances and exits use the shared slot rules. Do not paste duration/easing literals into every component. Continuous status indicators, such as a spinner or recording waveform, may have their own cycle because they communicate an ongoing state.

## Loading and search

Courses, grades, schedule, homework, settings and handbook load on demand. A shared Suspense boundary keeps the shell stable while the selected route loads. Keep conversation state, material storage, reset behavior and shared product timers outside route boundaries.

Global search builds a normalized index once per source snapshot, including a rebuilt snapshot when handbook content arrives. Keystrokes reuse that index; a closed search does not compute results. Preserve exact entity destinations, recent destinations, keyboard operation and focus restoration.

## Change and verification workflow

1. Identify the owning token, primitive or composition file before editing. Fix the owner and migrate all consumers together; avoid a feature-local workaround for a shared defect.
2. Run `npm run check:ui`, `npm test`, then `npm run build`. The build also runs the architecture guard. It checks the stylesheet entry, imports/assets, typography ownership and duplicated primitive motion literals.
3. Batch browser verification across the affected routes, 1440/375 px, both themes, text scaling and reduced motion. Verify control states, exact navigation and persistence where relevant.
4. Inspect the batch, fix actual failures together, then run a focused confirmation. Do not repeatedly rescreenshot unchanged screens or keep rebuilding without a new change.

The architecture guard is not a replacement for browser accessibility, layout or interaction checks. It prevents the coupling patterns that made earlier screen-by-screen changes inconsistent.

## Адаптивная ширина

`src/page-layout.css` владеет размерами оболочки и контейнеров. `.page-container[data-layout="reading"]` ограничивает основной контент 768 px, `workspace` — 960 px, `data` занимает оставшееся пространство. `.reading-prose` ограничивает строку 70ch. `data-with-rail` добавляет ширину отдельной панели сверх лимита основного контента; при переносе панели композиция задаёт `--layout-rail: 0px`.

Отступы 32/24/16 px зависят от доступной области. Глобальная навигация 256/64 px, дерево 256 px, дополнительные панели 288/320 px, библиотека 384 px, широкий Sheet 480 px. Панели курсов и библиотеки становятся overlay, когда постоянный столбец мешает основной задаче. Широкие таблицы используют локальную прокрутку.

## Уведомления

`src/data/notifications.ts` хранит только метаданные 18 событий и ID связанных сущностей. `src/lib/notifications.ts` разрешает данные и точные маршруты из общей учебной модели. `NotificationsProvider` хранит прочтение и исходное время истории в `student-notifications:v1`; обычное открытие ленты не помечает её прочитанной. Служебный сброс сессии также очищает это состояние.

Колокольчик открывает Popover последних пяти событий. История — Workspace-страница без локального поиска и постоянного пункта сайдбара. `src/notifications.css` владеет композицией строк, `src/styles/motion.css` использует общий fast-профиль для быстрого просмотра (180 ms при balanced). В minimal анимация отключена. «Важное» пересекается с категориями. «Цели» остаётся пустым до появления настоящих объектов целей в приложении; события занятий ведут в существующую карточку занятия расписания через `scheduleEventId`.

Объёмные тени используют постоянный тёмный `--shadow-color`, независимо от темы и цвета текста. В тёмной теме внутренние тени также не создают светлое свечение. Контуры фокуса и маски вокруг статусных точек сохраняют свои семантические цвета.

## Late Days

`src/data/late-days.ts` задаёт семестры и упрощённую политику. `src/lib/late-days.ts` владеет расчётами и проверкой плана, `LateDaysProvider` — общей локальной историей. `src/late-days.css` владеет композицией интерфейсов. В header и рядом со сроками сохраняется календарь с плюсом. Страница — Workspace до 960 px, Popover — общий размер 384 px. `LateDaysChart` един для страницы и быстрого просмотра; `RescuePlanner` един для массового диалога и Generative UI. Цвета — существующая пара violet/violet-soft, motion — общие профили. Детали воспроизводимого сценария и ограничений описаны в `docs/late-days-demo.md`.
