# NEW STUDENT — checkpoint 2026-11-18

Motion published in main: 535a67c; Pages HTTP200 and new reduced-chevron CSS verified. Disclosure220/180ms; StateIcon .96/no rotation, pin preserved. Follow-up fixed reduced chevron CSS override; frame tests1440/375 and 15 rapid status swaps passed. build/check:ui passed;142 tests passed before CSS-only fix. Evidence/limits: docs/motion-component-inventory.md. Known issue: mobile Handbook Escape loses trigger focus (outside motion scope). Previous HEAD94f0a21.

## Студент Антон и фото — завершено
- App.tsx: приветствие, профиль и aria-label. homework-storage.ts: автор новых комментариев. HomeworkDiscussion.tsx: авторы и цитаты старых сохранённых записей «Иван» отображаются как «Антон», без изменения текста комментариев.
- public/assets/figma/avatar-image.png заменён фото пользователя: квадрат400×400 из640×640 (x120,y60), итог256×256. Общий asset шапки/обсуждений, без CSS-изменений. Сотрудники Хэндбука с именем Иван не переименовывались.
- Chrome: profile/greeting, legacy authors/quotes/new comment/avatar, темы1440/375; /tmp/anton-*.png. 142 теста, build/check:ui и diff прошли. Опубликовано в 94f0a21.

## Персональный пропуск ДЗ — завершено
- Обратимый CircleSlash toggle «Не буду выполнять»/«Пропущено мной»/«Вернуть в план», skipped?:boolean по academicTask.id в student-homework:v1. Это личный признак: оценка, официальный статус, сроки и Late Days не меняются. Недоступен для сданных/проверенных/оценённых/архивных; сдача очищает флаг. Чтение и обсуждение доступны.
- Сквозные surfaces: курс/список/ДЗ/расписание/preview/уведомления/ведомость/forecast/GenUI/поиск/неделя/ContinueStudy/rescue/Late Days. All сохраняет пропущенные; active и рекомендации исключают. Общие ID, актуальный resolver, без синтетических forecast-ID. Сохранены cross-tab, validation, идемпотентность и отказ записи без смены UI.
- HomeworkPersonalControl.tsx, tests/homework-personal.test.ts и точечные подключения. Chrome skip/undo/reload/filter/темы1440/375/keyboard/double/cross-tab/quota/submit/chat;142tests/build/check:ui/diff pass. /tmp/skip-*.png и scripts. Опубликовано в94f0a21.

## Тени Cupertino — завершено
- Только CSS: surface=none, убраны статичные/обычные control/nav/hover/bevel тени; overlay и selected segments смягчены, чёрный shadow-color в обеих темах. Focus/composer ring и press fire сохранены, без изменения фонов/границ/радиусов/композиции.
- Chrome до/после1440/375/темы: navigator/courses/gradebook/forecast/settings и overlays. Снимки /tmp/shadows-*.png, скрипт /tmp/shadow-review.cjs. Проверки входят в актуальный прогон.

## «Моя неделя» — завершено
- ScheduleResponse + WeekStudyPlan; существующие Tabs и переходы. dayStudyLoad объединяет интервалы занятий, суммирует невыполненные блоки и активные сроки; окна только между занятиями >=30мин. Пороги нагрузки раскрыты в GenUI; неизвестные веса не используются.
- Блоки30/60/90/120мин: добавить, выполнить, перенести, удалить; useWeekPlan, student-week-plan:v1. Не меняют официальные данные. Перегрузка ведёт через onRequest в прежний RescuePlanner. Служебный reset сохранён.
- Проверены Chrome1440/375/темы, add/check/duration/move/reload, source deadlines/Late Days, окно13:20–14:00, material matrices-lecture/task linear-equations, fire/прочие саджесты/чат. Тесты включены в актуальный общий прогон.
- Ограничения: фиксированная учебная неделя, неизвестны сложность и полная личная занятость. Локальный план без синхронизации и времени блоков внутри дня.

## Сохранённые результаты предыдущих задач
- «Продолжить учёбу»: command → createMockResponse/sendMessage; optional presentation='continue-study' совместим со snapshot. academicTasks/homeworkStatus/taskDeadline; до3 new/in-progress grade=null, порядок срок/известный вес/обязательность/status/ID; submitted/accepted/rejected исключены. Причина, CTA, до2 альтернатив, EmptyState/курсы; без истории просмотров. lib/continue-study.ts, tests/continue-study.test.ts. Composer не стирается. Chrome primary/alternatives/submission/empty/restore/темы1440/375 проверены.
- Прогноз: раздел «Обучение», courseId из ведомости через studyTarget. Композиция Хэндбука: курсы слева, Sheet на mobile, без повторного заголовка; Card только метрики/график. GradeForecast.tsx/ForecastChart.tsx/forecast-scenarios.ts/grade-forecast.ts и tests. График в порядке работ (не дат): сценарий/максимум/цель, значения в details;3 будущие ДЗ только forecast-модель. academicTasks не мутируют, веса сохранены, допущение0–10/равновесные работы; без нормализации/официальных округлений/пересдач. Ожидание7/цель8 и reset. ScoreInput draft/точка/запятая/очистка/диапазон/blur/reset проверены. Полировка локальна GradeForecast.tsx/grades.css, без расчётных изменений; Chrome темы1440/900/375.
- Зачётка сохраняет 2 исторические сессии по4 строки, grades-table-shell, Card сессий, collapse и единое скачивание через actionStatus (файл не создаётся).

## Правила и публикация
- Linear.app 2026 Dark/Pure Light, De-island, don't flatten; общие widths/tokens и UX сохраняются. Не заявлять browser-run без фактической проверки. Impeccable и cu-proofread применялись к UI/текстам.
- AGENTS.md, DESIGN.md, общая конфигурация и зависимости не менялись. Исходный HEAD перед задачами 8255f3535f35d57f8fcd59fa3446b8853f7bc5cd. Публикация разрешена пользователем 18 ноября 2026.
- GitHub https://github.com/osipenko-stanislav/NEW-STUDENT; Pages https://osipenko-stanislav.github.io/NEW-STUDENT/. Push main запускает публикацию.

Published8eee3bf; Pages verified. Uncommitted shell.css: outer gaps8px top/right/bottom desktop, all corners8px; mobile0px. CDP Dark/Light1440/375:16frames, collapse/panel/scroll/Escape/focus pass, no overflow. Rects256/8/1176×884, collapsed64/8/1368×884, mobile0/0/375×812. artifacts/shell-inset;142tests/build/check:ui/diff pass. No commit.

## Linear tonal borders — complete locally (2026-11-19)
- Eight existing CSS owners only. Shared Dark recipe: --surface-fill padding-box + vertical --surface-edge border-box (card86/94%, foreground remainder). All neutral Card surfaces, course-resource-link (syllabus/chat/Mayak), results/files, standalone table shells, Handbook cards, widget popovers, Status Island. Hover keeps the edge. Nested previews/chips/text/mobile TOC/nested gradebook tables excluded; semantic colors and Light preserved. Composer input keeps its prior soft edge/focus.
- Source:7 assets/theme Woblo archives share CSS; sx-g3sxwd/19rovml rules exist but DOM/theme vars absent. Actual composer masked ::before has inline LCH fill10.149/edge25.433→16.32 (RGB28→59→40). Report and before/after screenshots: /tmp/student-tonal/REPORT.md and comparison.html.
- Chrome CDP Dark/Light1440/375:course5widgets/hover/focus/dialogs/settings/theme, catalog/forecast/Handbook/gradebook/semantic events and portal weather/status. build/check:ui/diff pass; existing chunk warning. All TS/TSX, shell, settings polish, AGENTS/DESIGN unchanged from task start. No commit/push.

## Settings polish — завершено локально (2026-11-19)
- Setting

## UI Workbench wiki navigation — завершено локально (2026-11-19)
- DEV Component Gallery перестроена в wiki-workbench: каталог групп с поиском/сворачиванием/active, один selected component по центру, context Inspector справа. 16 стабильных IDs по группам Foundations/Controls/Navigation/Surfaces/Data Display/Homework/Schedule/Courses/Materials & Library/Grades/Late Days/Generative UI/Feedback & Overlays. URL `component=` восстанавливает выбор. Mobile catalog открывается существующим Sheet; no horizontal overflow.
- Preview использует настоящий HomeworkItem и UI primitives, рендерит только выбранную запись. Inspector подключён к density/text size и показывает токены/поверхность. CSS lazy вместе с gallery chunk; production navigation unchanged. CDP Dark/Light 1440/375 layout/direct URL/mobile Sheet/no-overflow passed. 142 tests/check:ui/build/diff pass; прежний chunk warning. Без commit/push.
