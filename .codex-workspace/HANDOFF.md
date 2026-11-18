# NEW STUDENT — checkpoint 2026-11-18

Статус: студент переименован в Антона, аватар обновлён; предыдущие задачи сохранены. Пользователь разрешил публикацию всех накопленных обновлений в GitHub; подготовлены commit и push main.

Последняя правка CourseWidgets.tsx: убрана иконка CalendarClock из заголовка ближайшего дедлайна. Перед публикацией build/check:ui/diff прошли; 142 теста прошли ранее.

## Студент Антон и фото — завершено
- App.tsx: приветствие, профиль и aria-label. homework-storage.ts: автор новых комментариев. HomeworkDiscussion.tsx: авторы и цитаты старых сохранённых записей «Иван» отображаются как «Антон», без изменения текста комментариев.
- public/assets/figma/avatar-image.png заменён фото пользователя: квадрат400×400 из640×640 (x120,y60), итог256×256. Общий asset шапки/обсуждений, без CSS-изменений. Сотрудники Хэндбука с именем Иван не переименовывались.
- Chrome: profile/greeting, legacy authors/quotes/new comment/avatar, темы1440/375; /tmp/anton-*.png. 142 теста, build/check:ui и diff прошли. Публикация разрешена текущим запросом.

## Персональный пропуск ДЗ — завершено
- Запрос во вложении: сквозное «Не буду выполнять»/«Пропущено мной»/«Вернуть в план», личный признак, не академический статус. Пользователь уточнил UI: отдельная векторная кнопка CircleSlash (круг с диагональю) рядом с переносом; прямой обратимый toggle, без меню. Нейтральный фон выбранного состояния, aria-pressed, Tooltip, StateIcon; без новых островов.
- skipped?:boolean в прежнем HomeworkRecord/student-homework:v1 по academicTask.id. canSkipHomework/isHomeworkSkipped, setter в use-homework; валидация, идемпотентность, storage events, отказ записи без смены UI. Сданные/проверенные/оценённые/архивные не пропускаются. Локальная сдача очищает флаг. Чтение/материалы/обсуждение/решение не блокируются, таймер не останавливается.
- HomeworkPersonalControl через прежнюю группу DeadlineTransfer покрывает ДЗ курса, общий список, открытое ДЗ, course widgets/dialogs, расписание/list/grid/group Sheet, preview/widgets/уведомления. Добавлен в course program/longread, ведомости, forecast (только реальные ID), LateDaysDialog/историю и rescue, ContinueStudy/WeekStudyPlan. Поиск показывает текущую метку и ведёт в объект.
- Фильтр skipped в прежних FilterBuilder курса/общего списка/GenUI, личная метка доступна и в фильтрах ведомости. All сохраняет пропущенные; active/new/in-progress исключают. Explicit запросы всех/пропущенных добавлены в существующую таблицу фраз. resolveHomeworkAssignment читает актуальное состояние по ID; исторический DTO не источник решения.
- Продолжить учёбу, ближайшая сдача, active, Моя неделя/нагрузка/подготовка и Я в огне учитывают пропуск. Блоки подготовки сохраняются, возвращаются после undo. Пропущенные исключены из rescue-плана/подтверждения; lateDaysReason просит вернуть в план. Дедлайн остаётся академическим событием. Ноль не выставляется, прогнозные ожидания не меняются.
- Chrome: сквозной skip/restore/reload/filter, week/fire/continue/all, official data неизменны; темы1440/375, keyboard/double/cross-tab/quota/submit/chat. Снимки /tmp/skip-*.png, scripts /tmp/skip-{browser,extra,surfaces}.cjs. 142 теста/build/check:ui/diff прошли.

- Новые файлы: components/courses/HomeworkPersonalControl.tsx, tests/homework-personal.test.ts. Остальное — точечные подключения в существующих UI/хранилище/filters/projections/mock-assistant/week-plan/late-days, CSS courses/late-days и motion inventory. AGENTS.before-init/AGENTS/DESIGN/настройки не менялись. Локальное сохранение, без backend; синтетические forecast-ID не учебные объекты и пропускать их нельзя.

## Тени Cupertino — завершено
- Только CSS: surface=none, убраны статичные/обычные control/nav/hover/bevel тени; overlay и selected segments смягчены, чёрный shadow-color в обеих темах. Focus/composer ring и press fire сохранены, без изменения фонов/границ/радиусов/композиции.
- Chrome до/после1440/375/темы: navigator/courses/gradebook/forecast/settings и overlays. Снимки /tmp/shadows-*.png, скрипт /tmp/shadow-review.cjs. Проверки входят в актуальный прогон.

## «Моя неделя» — завершено
- ScheduleResponse + WeekStudyPlan; существующие Tabs и переходы. dayStudyLoad объединяет интервалы занятий, суммирует невыполненные блоки и активные сроки; окна только между занятиями >=30мин. Пороги нагрузки раскрыты в GenUI; неизвестные веса не используются.
- Блоки30/60/90/120мин: добавить, выполнить, перенести, удалить; useWeekPlan, student-week-plan:v1. Не меняют официальные данные. Перегрузка ведёт через onRequest в прежний RescuePlanner. Служебный reset сохранён.
- Проверены Chrome1440/375/темы, add/check/duration/move/reload, source deadlines/Late Days, окно13:20–14:00, material matrices-lecture/task linear-equations, fire/прочие саджесты/чат. Тесты включены в актуальный общий прогон.
- Ограничения: фиксированная учебная неделя, неизвестны сложность и полная личная занятость. Локальный план без синхронизации и времени блоков внутри дня.

## Сохранённые результаты предыдущих задач
- «Продолжить учёбу»: саджест отправляет command через createMockResponse/sendMessage. Обычный assignments block с optional presentation='continue-study', validator совместим со старыми snapshot. ContinueStudyResponse использует общие задания, homeworkStatus, taskDeadline, вес активности и category required; до3 текущих new/in-progress grade=null, сначала ранний deadline, затем известный вес активности, обязательность, status, ID. Accepted/submitted/rejected исключены, неизвестные сроки после известных. Причина и primary CTA + до2 альтернатив, при отсутствии — EmptyState/курсы. Никакой выдуманной истории просмотра/чтения. Composer при клике не стирается.
- Продолжить учёбу: lib/continue-study.ts, GenUI/ContinueStudyResponse.tsx и tests/continue-study.test.ts. Проверены Chrome primary/alternatives/live submission/empty/restore1440/375/темы; тесты включены в актуальный прогон.
- Прогноз — отдельный пункт «Обучение», ссылки из зачётки и ведомостей; из конкретной ведомости сохраняется courseId через studyTarget. Уточнённая пользователем композиция как Хэндбук: курсы слева, содержание справа на общей поверхности, Sheet navigation на узком экране. Нет повторного видимого заголовка «Прогноз». Пользователь разрешил Card только для метрик и графика, общей/вложенных нет.
- Прогноз: GradeForecast.tsx, ForecastChart.tsx, forecast-scenarios.ts, grade-forecast.ts, grade-forecast.test.ts. График — по порядку будущих работ, не по датам: сценарий/максимум/цель, текстовые значения в details. Добавлены 3 будущие домашки по courseTopics только в forecast-модель; academicTasks и записи не мутируют. Веса активностей сохранены; локальное допущение: 0–10, равновесные работы внутри активности. Без нормализации весов, официальных правил округления и пересдач. Исходное ожидание7/цель8, reset восстанавливает их.
- ScoreInput хранит draft, принимает точку/запятую/очистку, валидирует диапазон; blur возвращает/ограничивает число, reset сбрасывает draft. Chrome проверен. Полировка прогноза ограничена GradeForecast.tsx/grades.css: отступы и выравнивание, темы1440/900/375, без расчётных изменений.
- Зачётка сохраняет 2 исторические сессии по4 строки, grades-table-shell, Cupertino Card сессий, collapse и единое скачивание через actionStatus (файл не создаётся).

## Правила и публикация
- Сохранять Cupertino, De-island, don't flatten, общие widths/tokens; макеты задают структуру, не заменяют стиль. Не заявлять browser-run без фактической проверки. Impeccable и cu-proofread применялись к UI/текстам.
- AGENTS.md, DESIGN.md, общая конфигурация и зависимости не менялись. Исходный untracked .codex-workspace/AGENTS.before-init сохранён. Исходный HEAD перед задачами 8255f3535f35d57f8fcd59fa3446b8853f7bc5cd. Публикация разрешена пользователем 18 ноября 2026.
- GitHub https://github.com/osipenko-stanislav/NEW-STUDENT; Pages https://osipenko-stanislav.github.io/NEW-STUDENT/. Push main запускает публикацию.
