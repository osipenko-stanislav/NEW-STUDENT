# Courses surface

## Scope and direction

**Direction: Operate for the catalog and course; Read for longreads.** Courses extend the incumbent Central University / NEW STUDENT LMS world. Keep the existing header, sidebar, search, library panel, PT Root UI typography, semantic colors, and theme preferences. This brief documents the implemented surface; it does not replace the global design system.

The catalog contains 16 real discipline titles from the School of Technology bachelor Handbook, with a demonstration selection and enrollment categories. The complete example is **Машинное обучение (Machine Learning)**. Other cards open a truthful overview with links to the Handbook and the complete example; they do not claim to contain a populated curriculum.

**Content authority:** the [Handbook catalog](https://note.cu.ru/at/2284e072-1f5d-47d2-b4c9-cceb9716ef6f) supplies discipline names and available levels; the [Machine Learning syllabus](https://note.cu.ru/at/3340dcf5-0e15-43db-929f-7cdd950753bb) supplies its description, workload, assessment structure, and thematic plan. Figma supplies structural references only. The existing shadcn/ui components and theme supply visual authority; clarify with the user when the intended role of a mockup is ambiguous. A design reference is not authority for academic content.

## Visual language and typography

Use the existing shadcn/ui theme tokens in both themes. The workspace uses the background token; header sections use a bottom divider instead of a separate rounded island. Catalog and progress/deadline cards reuse the shared Card component. Buttons use standard default/outline/ghost variants and Tabs retain their shared muted track and active background. Other surfaces use the theme radius and border tokens. Catalog hover changes the border without lifting cards. Syllabus, chat, and help links are outline Buttons with Lucide icons, without decorative illustrations. Semantic colors remain for meaningful status, level, and progress information.

Catalog headings use 32px/1.25 at weight 600; course headings use 28px/1.3 at weight 600. Card titles use 15px/1.45 at weight 500. Course rows use 13–14px with 22px line height; metadata uses 11–13px. Reading text is 16px/1.75 with a 70ch measure; reading headings are 24px, 20px, and 16px. Existing `--text-scale` multiplies font sizes. Dates, scores, and durations use tabular numerals where defined.

Lucide area icons distinguish Разработка, Математика, and Общие. Lucide stars describe available formats/levels, not ratings or progress: basic is blue, medium red, advanced uses foreground. Some courses have multiple stars; some have none, including Machine Learning. Preserve this source distinction rather than assigning a uniform level.

## Layout and responsive behavior

Courses occupy the existing workspace with one internally scrolling, inline-size container. Catalog and course content are centered at a maximum width of 1440px with 32px padding. The catalog uses an auto-fill grid with a 228px minimum card width and 12px gaps. Course and reading views use a flexible main column and a 288px widget column separated by 24px. Widgets stick 24px below the scroll container top.

Breakpoints follow available **container width**, so opening the LMS sidebar or library can change the layout without changing viewport width.

| Container width | Behavior |
| --- | --- |
| 1000px or less | Page padding becomes 24px; widget rail becomes 256px with a 16px gap; recording filters stack. |
| 800px or less | Main content becomes one column; widgets follow it in a two-column grid. The sidebar TOC is replaced by a collapsible TOC above the article. Recording filters return to three columns. |
| 500px or less | Page padding becomes 16px; catalog stays in two compact columns; widgets and recording filters become one column. Course headings become 24px; reader text becomes 15px, with 20px horizontal padding. Rows and actions wrap. |
| 340px or less | Catalog becomes one column; lesson navigation stacks. |

Settings compact density reduces curriculum summary rows to a 52px minimum height and recording summary rows to 60px. Text-size and theme preferences apply immediately. Recording and deadline dates use shared display-format preferences with Moscow time. TOC anchor scrolling respects reduced motion; global reduced-motion styles constrain transitions.

## Catalog ordering and storage

The category controls are **Все**, **Обязательные**, **Факультативные**, **Вольнослушатель**, and **Внутренние**. They filter the selected demonstration enrollment set and update the visible count. Filters are component state; they are not persisted.

Cards open through an explicitly named button. HTML drag and drop moves a course before or after another card, using its horizontal midpoint as the target boundary. A dragged card fades; the destination gains a semantic-blue background and insertion marker. Dragging suppresses the click that would otherwise open the course.

Each card also exposes a keyboard-accessible dropdown: **В начало списка**, **Переместить выше**, **Переместить ниже**. Boundary actions are disabled. These actions use visible filtered neighbors, and the resulting order is stored across the full catalog. This menu is also the alternative when dragging is unavailable. A live status announces the saved position in the full list; do not describe the native drag interaction itself as a keyboard drag implementation.

Order is stored locally under `student-course-order:v1`. Loading discards unknown IDs, removes duplicates, and appends current courses missing from the saved list. Invalid JSON, invalid record shape, or inaccessible storage falls back to default order and exposes an alert. A failed save retains the previous order and reports the storage error; it must not announce a successful save. Full application-data reset includes this key. Course position is device-local; it is not an account preference or a server record.

## Course, dialogs, and learning states

Machine Learning opens with **Курс** and **Видеозаписи** tabs. Its curriculum is the actual **four blocks and 15 topics** in source order:

1. Основные термины машинного обучения и смежных областей. Оценка качества моделей — 2 topics.
2. Линейные модели — 3 topics.
3. Деревья решений и модели, основанные на них — 5 topics.
4. Обучение без учителя и работа с признаками — 5 topics.

The Handbook does not map these topics to weeks. Preserve blocks and topics; do not invent a weekly schedule. Block 1 additionally includes a demonstration practice link, homework, and local PDF, separate from the 15 sourced topics. Expandable block summaries expose their state and permit multiple blocks to remain open. Lesson completion and “В работе” indicators are illustrative; opening material does not change them.

Widgets provide syllabus, progress, nearest deadline, course chat, and study help. The syllabus dialog shows the sourced description, workload of two lectures and two seminars per week, block links, and assessment weights: homework 30%, colloquia 30%, project 20%, exam 20%. Block links close the dialog, open the relevant block, and scroll to it. Progress is demonstrative (6.8 out of 10, with 2 still available), presented as a meter and read-only details. Deadline and assignment details are also examples; no solution submission or grade editing is implemented.

The chat dialog contains an explicitly demonstration message with sending disabled. Study help links to the Handbook or opens the existing Navigator with a course question. This reuses the application's demonstration Navigator behavior and does not connect a new AI service. Existing Dialog primitives provide named titles/descriptions, modal focus behavior, dismissal, and scroll containment.

Course, lesson, tab, expanded blocks, and dialogs live in React component state. Opening a new course resets its tab and block expansion. Changing course/lesson/tab resets the internal scroll position. Breadcrumbs return to the catalog, course program, or originating block. There are no URL routes, deep links, or persisted reading positions for this feature.

## Recordings and reading

Recordings combine case-insensitive title search with date, teacher, and class-type filters. Filters intersect; clearing search and resetting all filters are separate actions. The results count is a live status. Empty results explain how to recover and provide a reset button. Expandable classes show teacher names and recording durations; classes without records say **Запись ещё не опубликована**. Dates, teachers, class times, and durations are demonstration data. No real video file is included: both recording dialogs and the lesson video section state unavailability rather than presenting a working player.

All 15 topics open longreads with source titles and demonstration summaries, focus points, prose, practice, local resources, video information, assignment, and conclusion. The first two topics have tailored metric/validation explanations; later topics reuse a general learning scaffold. They are prototype content, not complete official teaching materials. Previous/next navigation follows the source topic sequence across blocks and disables the first/last boundary. The footer contains previous/next navigation only. The program action beside the TOC opens a right Sidebar panel styled like the materials library. On narrow screens it is placed above the article. The panel contains all four collapsible blocks, all topics, assignments, and materials, and highlights the current lesson. Choosing a lesson keeps the panel open on desktop and closes it on mobile; closing or Escape restores focus to the visible program trigger. Breadcrumbs still navigate to the course overview.

The seven-entry TOC tracks the active heading against the internal scroll area, including its nested “Ключевые идеи” item. Links expose `aria-current="location"`, scroll to focusable headings, and transfer focus without a second scroll. Narrow layouts use the collapsible TOC. The workflow diagram is native SVG with an accessible title and semantic colors. PDF and Markdown resources have independently labelled open and download actions; they are actual local prototype files, not remotely fetched course attachments.

## Assets, provenance, and limits

`public/assets/courses/` contains the three area SVGs, three level-star SVGs, `syllabus-cap.webp`, `course-chat.webp`, `study-help.webp`, and the prototype resources `metrics-notes.pdf` / `validation-guide.md`. The area, star, and widget illustration files are historical assets and are not used by the course UI. Icons use Lucide; meaningful level information is available through names and keyboard-focusable tooltips. Learning resource URLs use `import.meta.env.BASE_URL`.

Figma reference node IDs are recorded in `courseSources.design`: catalog `3450:3988`, course `2918:23365`, expanded program `2551:25198`, topic `3129:37441`, recordings `3129:15467`, lesson `1953:25496`, longread `1819:20030`. Keep these as structural provenance only; do not reproduce their visual styling without an explicit request. The Handbook URLs above remain academic content authority. Enrollment categories, progress, statuses, assignments, recordings, prose, and local PDF/MD resources must remain identified as demonstration data. There is no backend enrollment, synchronization, actual video playback, course-chat delivery, new AI integration, or additional dependency.

## Source of truth

Implementation: `src/components/courses/CoursesWorkspace.tsx`, `CourseCatalog.tsx`, `CourseWidgets.tsx`, `CourseRecordings.tsx`, `CourseLongread.tsx`, `CourseDiagram.tsx`, and `CourseDialogs.tsx`; styles: `src/courses.css`; content/provenance: `src/data/courses.ts`; ordering: `src/lib/course-order.ts`. Shell integration is in `src/App.tsx`; display preferences come from `src/components/SettingsProvider.tsx` and `src/lib/display-formats.ts`; full reset is in `src/lib/session-reset.ts`. Inherited typography, palette, and reduced motion remain defined by `src/index.css` and `src/semantic-colors.css`.

## Return navigation

Course and lesson pages place the shared PageBackButton between breadcrumbs and the title. Course returns to the catalog; lesson returns to the course overview. No duplicate return action appears below the content. Previous/next lessons remain sequential controls. This uses local React state and does not introduce URL or browser-history routing.
