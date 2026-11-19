# NEW STUDENT interface system

The visual reference is Linear.app (2026 redesign), in Linear Dark and Pure Light, retaining the implemented neutral palette, semantic study colors, PT Root UI and selective Universita accents. Prioritize visual fidelity, layout quality, composition and complete interaction states. Keep React, shadcn/ui, Radix and Motion, the single token system and existing style owners; visual changes preserve product, navigation and UX contracts. Product behavior and student-facing content are governed by AGENTS.md. This document describes the implemented system and where changes belong.

## Ownership

`src/main.tsx` imports **only `src/index.css`**. That file is the ordered stylesheet manifest; add imports there rather than adding another override entry to the application.

| Responsibility | Source of truth |
| --- | --- |
| Light/dark palette, fonts, radii, elevation | `src/styles/tokens.css` |
| Semantic status and file colors | `src/semantic-colors.css` |
| Fonts, browser defaults, selection, caret, scrollbars | `src/styles/base.css` |
| Shared control and surface appearance | `src/styles/components.css` |
| Global student action feedback | `src/lib/action-status.ts`, `src/components/StatusIsland.tsx`, `src/styles/status-island.css` |
| Explicit content typography | `src/styles/typography.css` |
| Motion values shared by CSS and React | `src/lib/motion-tokens.ts` (shell), `src/lib/motion-recipes.ts` (component contracts) |
| Shared transitions, entrances, reduced-motion rules | `src/styles/motion.css` |
| Stable header and workspace geometry | `src/styles/shell.css` |
| Desktop, collapsed and mobile navigation | `src/styles/navigation.css` |
| Chat, composer and generated response composition | `src/styles/chat.css` |
| Widgets and library/file composition | `src/styles/widgets.css`, `src/styles/materials.css` |
| Page gutters, widths and hierarchical navigation | `src/page-layout.css` |
| Feature-specific composition | `src/settings.css`, `src/courses.css`, `src/grades.css`, `src/study-pages.css`, `src/global-search.css` |
| Handbook reading composition, loaded with its route | `src/handbook.css` |
| Developer-only motion catalog, loaded only in DEV | `src/styles/motion-lab.css` |

Shared component rules live in the shared system; feature-specific composition lives alongside the layout it modifies. Do not recreate a final stylesheet that patches all preceding files or a parallel theme namespace. Use the supplied Linear 2026 screenshots and [DesignKit raw extraction](https://github.com/caio-overmind-ventures/designkit/tree/main/extractions/app.linear.app) as visual evidence; verify portable exports against raw values and screenshots. Historical adaptation notes and appearance descriptions in behavior/motion documents are not current visual requirements; this document and the implemented tokens govern appearance.

## Component contracts

Use `src/components/ui` before adding a component. Primitives own behavior, accessibility and semantic `data-slot` hooks; shared CSS owns their appearance. Feature classes own composition, not a second implementation of the same control.

### Surface hierarchy

- **Content surface** — открытое рабочее содержимое: статьи, списки, таблицы, заголовки и текстовые ответы.
- **Functional island** — самостоятельные виджеты, инструменты, панели, формы и интерактивные Generative UI-компоненты. Они сохраняют самостоятельную поверхность на общих токенах Linear, если она помогает их назначению. De-island, don’t flatten: убирай необоснованную фрагментацию, сохраняя функциональные поверхности.
- **Overlay surface** — Popover, Dialog, Dropdown, Sheet и контекстные меню.

Граница React-компонента сама по себе не требует визуального контейнера. Не добавляй поверхность вокруг уже самостоятельного острова и не уплощай функциональную поверхность механически: решение принимает композиционная роль объекта.

- **Button/Input/Select/Switch/RadioGroup** retain their semantic variants and accessible names. Customize a control in the primitive or shared stylesheet so every instance receives the change. Button primitives do not supply competing radius/shadow utility defaults: shared CSS owns these values, while feature compositions can specify purposeful exceptions. Controls use 32 px desktop height and 8 px corners; touch targets remain at least 44 px where required. Pill geometry is intentional for primary/secondary actions confirmed by raw extraction, not a global Button default. General surfaces/previews use 8 px corners and dialogs 12 px. Neutral selected states do not add raised depth. Preserve necessary overlay shadows. Existing card and widget borders use a dark-only subtle directional gradient edge (`--surface-edge`); controls, the main canvas island and internal separators keep their existing borders. Borderless content stays borderless; semantic event cards retain their hue. The composer retains its own softer edge and focus ring. Switch uses a 40×24 px track and 24×16 px capsule thumb, with a 12 px travel; geometry belongs to the shared component rather than settings-only overrides.
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

## Прокрутка Gen UI в Навигаторе

Переписка и все встроенные ответы используют одну вертикальную прокрутку `.workspace-chat`: расписание дня/недели, домашки, материалы, баланс/история Late Days и все стратегии переноса. Встроенные списки подходящих и исключённых заданий в RescuePlanner растут по содержимому; ограничение высоты и отдельный scroll остаются только у модальных сценариев. Поле ввода сохраняет собственную прокрутку длинного текста. Раскрытие деталей и изменение фильтров не должны перехватывать прокрутку переписки.

## Адаптивная ширина

`src/page-layout.css` владеет размерами оболочки и контейнеров. `.page-container[data-layout="reading"]` ограничивает основной контент 768 px, `workspace` — 960 px, `data` занимает оставшееся пространство. `.reading-prose` ограничивает строку 70ch. `data-with-rail` добавляет ширину отдельной панели сверх лимита основного контента; при переносе панели композиция задаёт `--layout-rail: 0px`.

Рабочие экраны используют горизонтальные отступы 24 px, на мобильной ширине — 16 px. Reading сохраняет отступы 32/24/16 px в зависимости от доступной области. Глобальная навигация 256/64 px, дерево 256 px, дополнительные панели 288/320 px, библиотека 384 px, широкий Sheet 480 px. Программа курса всегда открывается поверх материала в Sheet width="wide" (480 px, на узком экране — доступная ширина с общим отступом). Открытие не меняет ширину, положение и состав области чтения. Панель библиотеки становится overlay, когда постоянный столбец мешает основной задаче. Широкие таблицы используют локальную прокрутку.

## Плотность рабочих экранов

Компактная плотность рабочего UI ориентируется на Linear.app 2026. Сохраняются реализованные сетки и композиционные роли: документы, таблицы, настройки, хронология и функциональные виджеты не сводятся к одному карточному шаблону. Текст уроков и Хэндбука сохраняет прежние ширины, межстрочные интервалы и ритм абзацев.

Общие значения находятся в `src/styles/tokens.css`: содержимое поверхности — 16 px, небольшой поверхности — 12 px, вертикальный отступ заголовка — 10/8 px, строки списков и ячейки таблиц — 12 px. Рабочий экран начинается с отступа 24 px. Настройка «Компактный» дополнительно сокращает эти расстояния через те же токены.

`CardHeader`, `CardContent` и `CardFooter` задают зоны самостоятельной карточки; `Card size="sm"` используется для небольших виджетов. Общая геометрия принадлежит `src/styles/components.css`, состав и расположение — разделу. Не складывать padding соседних обёрток и не добавлять вложенную поверхность вокруг содержимого ради отступа. Нижняя кнопка остаётся частью карточки; на touch-устройствах её высота не меньше 44 px. Таблицы используют общие `table-head`/`table-cell` слоты; таблицы внутри читаемых статей сохраняют собственную композицию.

## Боковые панели и фильтры

Глобальная навигация использует `Sidebar variant="sidebar"`, ширина 256/64 px. Библиотека и дерево Хэндбука примыкают к краям рабочей области; внешние отступы и скругления floating отменены. Боковые Sheet также открываются от края экрана. Мобильное меню возвращает фокус на вызвавший его элемент; minimal/reduced отключает пространственные переходы боковых Sheet и изменения ширины навигации.

`src/components/ui/filter-builder.tsx` реализует общий конструктор выпадающих фильтров: параметр → условие → значение. Шесть операторов: равно, не равно, одно из, ни одно из, пусто, не пусто. Составные условия пересекаются (AND), значения «одно из» объединяются (OR). Поиск не получает автофокус при открытии или переходе шага: фокус остаётся на поповере. Выбор применяется сразу; черновик без условия/значения не меняет выдачу. Активные чипы редактируются, удаляются отдельно или сбрасываются вместе. Пустое значение отличается от отсутствующего поля. Расчёты — `src/lib/filters.ts`, общие стили — `src/styles/components.css`. Используются существующие Radix Popover и Checkbox без новой библиотеки.

Конструктор используется в домашках, записях, ведомостях, фильтрах расписания и списке домашних заданий Навигатора. По уточнению пользователя табы категорий курсов, переключатели событий расписания, категории уведомлений/поиска и навигационные вкладки сохраняются. Семестр Late Days и вид расписания остаются навигацией/представлением. `homeworkConditions` и `scheduleConditions` сохраняются в общей навигации; прежние одиночные параметры поддерживаются для точных переходов из поиска, уведомлений и Gen UI. Изменение вкладки событий расписания сохраняет составные условия.

## Архив как отдельный раздел

Архив доступен через вкладку «Архивные», а не через оператор конструктора фильтров. Ведомости имеют три непересекающиеся вкладки: текущие курсы по семестрам, текущие курсы вне семестра и все архивные. Правило разделения — `src/lib/academic-scope.ts`. Сброс фильтров не меняет выбранный раздел.

В каталоге курсов сохранены прежние категории и добавлена вкладка «Архивные» на основе `enrollments`. Домашки разделены на «Текущие» и «Архивные». В Late Days — «Текущий семестр» и «Архивные»; выбор семестра отображается только в архиве. Архивные курсы содержат имеющиеся исторические задания и ведомость; текущая программа/виджеты не выдаются за историческую версию.

Архивный контекст определяется ID зачисления (`courseEnrollmentId` в навигации), а не одним ID курса. `tasksForCourse` и `statementForCourse` принимают необязательный enrollmentId; по умолчанию работают с текущим зачислением. Переходы между заданием, курсом и ведомостью сохраняют этот контекст, обычный переход в курс его сбрасывает. Архивные задания доступны для просмотра результата, материалов и истории без редактирования, комментариев, переноса срока и расхода Late Days. Служебный сброс контекста сохранён.

## Уведомления

`src/data/notifications.ts` хранит только метаданные 18 событий и ID связанных сущностей. `src/lib/notifications.ts` разрешает данные и точные маршруты из общей учебной модели. `NotificationsProvider` хранит прочтение и исходное время истории в `student-notifications:v1`; обычное открытие ленты не помечает её прочитанной. Служебный сброс сессии также очищает это состояние.

Колокольчик открывает Popover последних пяти событий. История — Workspace-страница без локального поиска и постоянного пункта сайдбара. `src/notifications.css` владеет композицией строк, `src/styles/motion.css` использует общий fast-профиль для быстрого просмотра (180 ms при balanced). В minimal анимация отключена. «Важное» пересекается с категориями. «Цели» остаётся пустым до появления настоящих объектов целей в приложении; события занятий ведут в существующую карточку занятия расписания через `scheduleEventId`.

Объёмные тени используют постоянный тёмный `--shadow-color`, независимо от темы и цвета текста. В тёмной теме внутренние тени также не создают светлое свечение. Контуры фокуса и маски вокруг статусных точек сохраняют свои семантические цвета.

## Быстрый просмотр из header и Навигатора

`src/components/ui/preview-popover.tsx` задаёт общую композицию уведомлений, расписания и виджетов Навигатора: ширина 384 px, заголовок, прокручиваемое содержимое, нижняя ghost-кнопка со стрелкой. Общие стили — `src/styles/components.css`, движение — fast-профиль уведомлений в `src/styles/motion.css`. Открытие по клику, закрытие повторным кликом, снаружи или Escape; Radix восстанавливает фокус. Погода использует ту же оболочку без перехода в несуществующий раздел.

Календарь header открывает `SchedulePopover`: ближайшие незавершённые занятия и несданные дедлайны на текущий день Москвы. `src/lib/schedule-preview.ts` фильтрует и сортирует события; сроки и статусы поступают из общих Late Days и homework providers. Время обновляется при открытии и каждые 30 секунд, пока поповер открыт. Нижняя кнопка открывает сегодняшний день без прежних фильтров; строки ведут в карточку занятия либо конкретное задание. Строки учебных виджетов Навигатора также открывают конкретные сущности.

## Late Days

`TaskDeadline` объединяет текущий срок и действие `DeadlineTransfer`. Отдельное действие используется рядом с дедлайном в виджетах, поповерах, уведомлениях, календаре и ответах Навигатора. Оно разрешает задание по общему ID и открывает тот же диалог переноса; недоступность объясняет Tooltip. Не вкладывать кнопку переноса в кнопку перехода к заданию. Архив остаётся только для чтения; исторические сроки операций и предварительный просмотр в самом диалоге не получают повторное действие переноса.

`src/data/late-days.ts` задаёт семестры и упрощённую политику. `src/lib/late-days.ts` владеет расчётами и проверкой плана, `LateDaysProvider` — общей локальной историей. `src/late-days.css` владеет композицией интерфейсов. В header и рядом со сроками сохраняется календарь с плюсом. Страница — Workspace до 960 px, Popover — общий размер 384 px. `LateDaysChart` един для страницы и быстрого просмотра; `RescuePlanner` един для массового диалога и Generative UI. Цвета — существующая пара violet/violet-soft, motion — общие профили. Детали воспроизводимого сценария и ограничений описаны в `docs/late-days-demo.md`.

## Мелкие взаимодействия

`motion-tokens.ts` владеет отдельными micro-профилями: minimal без пространственной анимации, balanced 150 ms, expressive 180 ms с большей амплитудой и менее жёстким spring. Макропрофили не меняются. Семантическое движение описано в `styles/motion.css`, геометрия общих контролов — в `styles/components.css`.

`AnimatedNumber` сохраняет места под цифры и заменяет только изменившиеся разряды, без анимации при первом показе. `StateIcon` сохраняет размер при Copy → Check и Refresh → Syncing → Success. Короткое подтверждение синхронизации появляется только после фактического перехода состояния, без искусственного ожидания. Badge получает feedback при изменении текста/статуса, а не на каждом ререндере.

Tabs и SegmentedControl используют общий измеряемый индикатор выбранного элемента, сохраняя Radix/нативную клавиатуру и прокрутку. Switch сохраняет Radix-семантику с общим micro-spring; Checkbox остаётся нативным input с анимируемой галочкой и поддержкой indeterminate; Radio сохраняет Radix. Stepper меняет значение немедленно и не анимирует редактируемый текст; анимируются кнопки, пересчитанные цифры и предпросмотр даты.

Файловые строки и вложения используют ограниченный layout/presence feedback только при добавлении/удалении. Повторное открытие библиотеки не проигрывает анимацию всей ленты. Начертания звёзд уровней и другие декоративные иконки остаются статичными. Действия, которых ещё нет в продукте (например сохранение глобальных закладок), не имитируются ради motion.


## Crafted motion recipes

Независимые контракты маленьких объектов живут в `src/lib/motion-recipes.ts`, без множителя 1.5. Существующие макропрофили оболочки сохранены в `motion-tokens.ts`. CSS получает значения от того же AppMotionProvider, который управляет Motion for React. Приоритет системного reduced motion сохранён.

Инвентаризация всех применимых типов и проверка: `docs/motion-component-inventory.md`. Полные состояния, параметры, повторный запуск и reduced: `docs/motion-recipes.md`. Компоненты с разными назначениями используют разные easing/длительности; универсальный micro-профиль остаётся только для базового press и существующих пружин.

`NotificationIndicator` использует настоящий unreadCount, независимые ring900/slide260/pop500/fade400/close180/digits500 рецепты Transitions.dev. Восстановленный unread не звонит. Звук выключен по умолчанию; production не создаёт AudioContext. Optional API проверяется в developer-only Motion Lab после явного нажатия.

`FeedbackButton`, `AsyncButton` и `useActionFeedback` связывают результат с фактической операцией. `AnimatedStatus` резервирует подписи, `GradeValue` использует digit-level counter, `SyncIcon` имеет разгон, seamless busy loop и торможение. `CalendarDatePicker` один для Late Days и расписания; в существующем Popover расписания используется inline-вариант без дополнительного уровня. `AnimatedDisclosure` сохраняет DOM для закрытия с inert; для native details есть natural height и доступный fallback.

Motion Lab открывается по `?motion-lab=1` только в Vite DEV; production lazy import удаляется сборщиком. Он использует общие компоненты и настройки приложения, без второго приложения и без пункта студенческой навигации.

## Статусы действий

Операции и изменения данных студента используют единый Status Island под глобальным header. Навигация и восстановленные данные не создают событий. Состояния кнопок и локальные ошибки сохраняются, общие повторные сообщения об успехе заменяются айлендом. Внешний вид использует общие токены Linear Dark / Pure Light; morph/swap-анимация — по Kokonut с обязательным minimal/reduced вариантом. Прежние описания оформления в документе Status Island исторические; его API и поведенческие контракты сохраняются. API, области подключения, таймеры, фокус и источник описаны в [docs/status-island.md](docs/status-island.md).
