# Motion inventory — NEW STUDENT

Это карта типов интерактивных объектов и их реальных потребителей, а не перечень добавленных CSS transition. Рецепты и их параметры описаны в `motion-recipes.md`; интерактивная проверка — developer-only `?motion-lab=1` в Vite dev. Студенческая навигация не содержит Motion Lab.

Обозначения: CSS — нативное локальное состояние, Motion — управляемая смена объектов/геометрии. Minimal/reduced во всех строках убирает вращения, перемещения, blur и scale; логическое состояние остаётся доступным сразу. Проверки выполняются с клавиатуры и указателем, на 1366/375 px, в обеих темах.

| Тип и потребители | Реальные состояния | Рецепт, параметры | Реализация / reduced | Статус | Как проверить |
| --- | --- | --- | --- | --- | --- |
| Header IconButton: панели, профиль, закладки, библиотека | idle/hover/press/open | icon press 150 ms, scale .97; open surface | Button + CSS; minimal без scale | Реализовано | Нажать, повторить, Escape; геометрия 32 px стабильна |
| Направленные стрелки: уроки, история, ссылки | hover/press/disabled | arrow 150 ms, 2 px по направлению | CSS; minimal 0 px | Реализовано | Hover на следующем/предыдущем уроке и внешней ссылке |
| Settings/Trash/Plus: настройки виджетов, меню файла, вложение | hover/press/open | gear 8°; lid tilt; plus 45° при open | CSS по роли; minimal без поворота | Реализовано | Открыть меню вложений, проверить reset и disabled |
| Action Button: экспорт, сохранение решения, обновление | idle/loading/success/error/reset | action/icon swap, 160/120 ms; реальная Promise | FeedbackButton/AsyncButton + StateIcon | Реализовано | Экспорт существующего файла и ошибка чтения; ширина не меняется |
| Dropdown Menu: файлы, разговоры, вложения | closed/open/highlighted/selected/disabled | menu 160/120 ms; локальный акцент пункта | Radix + CSS; minimal статическое состояние | Реализовано | ArrowDown, Enter, Escape, быстрый повтор |
| Popover: уведомления, Late Days, погода, виджеты | closed/open/close | origin-aware existing overlay; локальные контролы независимы | Radix + CSS/Motion; minimal fade | Реализовано | Клик, outside, повторный клик, Escape |
| Tooltip: иконки, месяцы графика, дедлайны | hidden/open/close | 120/80 ms, 2 px | Radix + CSS; minimal opacity | Реализовано | Hover и focus; не блокирует click |
| Checkbox: массовый Late Days, Gen UI | unchecked/checked/mixed/disabled | check draw 180 ms, fill 120 ms | Native input + SVG/CSS; minimal итоговая галочка | Реализовано | Space, повтор, indeterminate, родитель не масштабируется |
| Radio: настройки темы | unchecked/checked/disabled | dot 160 ms, scale .6→1; pill 180 ms | Radix + indicator; minimal мгновенно | Реализовано | Стрелки, быстрый выбор между тремя темами |
| Switch: настройки, unread filter, предпочтения | off/on/press/disabled | switch spring 700/38/.5; express 650/29/.5 | Radix + Motion; minimal x меняется мгновенно | Реализовано | Space и быстрые повторные переключения |
| Tabs/Segments: курсы, ведомости, файлы, фильтры | inactive/active/focus/disabled | tabs 180 ms geometry-following | Общий SelectionIndicator + CSS | Реализовано | Быстро A→B→C→A, горизонтальная прокрутка, смена ширины |
| Disclosure: группы навигации и дерево Хэндбука | collapsed/expanded | tree chevron 90°, 180 ms, center | Один стабильный SVG + CSS | Реализовано | Раскрыть и закрыть ту же ветку несколько раз |
| Accordion: программа курса, записи, темы ведомости, Gen UI | closed/open/close | disclosure 220 ms height, chevron 180° | Native details + interpolate-size; minimal мгновенно | Реализовано | Прервать раскрытие закрытием; соседние строки не проигрывают enter |
| Input/Textarea: поиск, решение, комментарий, rename | idle/focus/invalid/disabled | field 120 ms focus/outline, placeholder | Native + CSS; minimal читаемый focus | Реализовано | Ввод, выделение, ошибка, Tab; нет движения текста |
| Search clear: глобальный поиск | empty/query/clear | clear 120/80 ms, зарезервированное место | Presence внутри постоянного слота | Реализовано | Очистить, фокус остаётся в поле, ширина не меняется |
| Select: курсы, фильтры, настройки, семестр | closed/open/highlighted/checked/disabled | select 160 ms chevron/check | Radix + CSS | Реализовано | Space, Arrow, Enter; выбранное значение и иконка согласованы |
| Date Picker: расписание и новый дедлайн | closed/open/date/month/selected | calendar 180 ms local month/selected | Shared CalendarDatePicker + native editable fallback | Реализовано | Следующий/предыдущий месяц, выбор и ввод даты, клавиатура |
| Stepper: Late Days dialog/Gen UI | idle/focus/increase/decrease/invalid/disabled | step press 150 ms; value сразу, derived counter 220 ms | NumberStepper + AnimatedNumber | Реализовано | Быстрый +/−, набор и выделение текста, лимит |
| Numeric Counter: Late Days, выбор, уведомления, прогресс, оценки, таймер | stable/change/reset | counter 220 ms, 2 px; только изменившийся разряд | AnimatedNumber, fixed digit slots | Реализовано | У 15→14 десятки остаются тем же DOM-объектом |
| Status Badge: домашки, ведомости, файлы | current/changed | status 180/160 ms, icon/text local | Badge + StateIcon/AnimatedStatus | Реализовано | Отправить решение, перерисовать без изменения статуса |
| Progress: sync, расход дней, прогресс курса, таймер | idle/progress/complete | progress 180 ms; determinate value | CSS width/scale, общий профиль | Реализовано | Значение обновляется без задержки действия; reduced статично |
| Notification Bell: настоящий header | restored/new/read/zero | точный bell/badge/digit рецепт эталона | NotificationIndicator + Motion/CSS | Реализовано | Внешнее увеличение unread, повторное событие, read-all, reload без ring |
| Sync: header и учебные настройки | current/update/syncing/success/error | rotation только пока busy; brake → check → idle | StateIcon/SyncIcon, реальная модель | Реализовано | Offline error, retry, успешное завершение; без ложного Check |
| Copy: Хэндбук | copy/pending/success/error/reset | swap 160/120 ms, check draw; reset 900 ms | StateIcon + реальный Clipboard | Реализовано | Копирование, отказ Clipboard, повтор до reset |
| Pin: история разговоров | unpinned/pinned/unpin | pin fill/impulse 180 ms, reverse 120 ms | StateIcon + CSS; initial без импульса | Реализовано | Закрепить, открепить, reload; строка не bounce |
| Bookmark/Heart/Stars | Нет сохранения; звёзды уровней декоративные | Не имитировать save; обычная точка входа получает press | Существующее поведение сохранено | Не применяется | Не должно быть ложного fill при открытии заглушки закладок |
| File Item: библиотека и вложения | idle/hover/add/remove/reorder | file 180/140 ms, position spring | Presence/layout только актуальных строк | Реализовано | Добавить/удалить личный файл, повторно открыть библиотеку |
| File preview/export/attach: курс, урок, файл | loading/ready/error/export/attach | action + icon swap, real operation only | AsyncButton/FeedbackButton/StateIcon | Реализовано | Реальный Blob, ошибка, прикрепление в чат |
| Voice control: композер | idle/recording/transcribing/cancel | mic→stop→spinner, numeric timer | StateIcon + AnimatedNumber; spinner static in reduced | Реализовано | Записать, остановить, отменить; бизнес-сценарий не меняется |
| Chat send/attachments: Навигатор | empty/ready/sending/complete | send glyph transfer; attach local presence | CSS + StateIcon, существующая модель генерации | Реализовано | Отправить и быстро повторить; disabled блокирует только реальную занятость |
| Schedule period/day controls | date/period/view/selected | directed navigation + calendar day local indicator | CSS/CalendarDatePicker | Реализовано | Листать, выбрать дату; вся сетка не fade при выборе |
| Table sorting: ведомости | none/asc/desc | arrow swap 160 ms | SortIndicator + StateIcon | Реализовано | none→asc→desc, строки таблицы не анимируются |
| Course level/progress controls | level/progress/tooltip | counter/progress, статичная декоративная звезда | AnimatedNumber + CSS | Реализовано | Навести/Tab; не анимировать звёзды как Like |
| Late Days confirmation | editable/review/invalid/applied | counter/check/action, без full-block enter | Shared planner, transaction unchanged | Реализовано | Недостаток, stale plan, double click, atomic apply |
| Generative UI | local selection/value/state/result | Те же checkbox/stepper/status/counter | Общие примитивы; корневой блок не переигрывается | Реализовано | Изменить одну галочку и проверить animations только у локальных объектов |
| Support launcher/close | idle/open/close | icon press, close crossing 120 ms | Существующие Button/Popover | Реализовано | Клик, повтор, Escape, mobile |

## Результаты проверки · 13 ноября 2026

- 12 комбинаций в Motion Lab: 1366/375 px × light/dark × minimal/balanced/expressive. Проверены Bell, Checkbox/mixed, Switch, быстрые Tabs, Counter, Stepper, Status, Calendar, Clipboard/action, File add/remove/reorder. Высота календаря постоянна, фокус сохраняется при смене месяца, horizontal overflow отсутствует.
- Те же 12 комбинаций на реальных экранах: header, виджеты, sync success, глобальный поиск/clear, Хэндбук/Copy, Tabs курса, Late Days/Stepper/баланс, массовый выбор, библиотека/вложения.
- 4 дополнительных сценария: Radio с клавиатуры, accessible labels/axe, mixed Checkbox, Clipboard error без Check, Gen UI без повторного enter родителя, реальная offline sync error. Включён 375 px dark с системным reduced motion.
- 4 дополнительных сценария в обеих темах и ширинах: restored/external unread, открытие Popover без ring, reset после reload, реальный экспорт и reset, календарь расписания с PageDown/Arrow/Enter, сортировка ведомости, прерывание Badge exit повторным событием. AudioContext не создаётся в header; в Lab звук включается только жестом, играет только на новом событии и отключается без остаточного сигнала. Axe Lab: нет serious/critical нарушений.
- 2 финальных lifecycle-прохода (1366 balanced / 375 reduced): разгон, остановка и быстрый повтор sync; прерванное закрытие disclosure; реальные добавление/удаление файлов решения и сохранение с Check.
- `npm test`: 112/112. `npm run build`: успешно, включая UI architecture guard и TypeScript. Сохраняется предупреждение Vite о размере основного chunk; задача не меняет стратегию bundling. Проверено, что код Motion Lab не входит в production JavaScript.

Для повторной ручной проверки открывай DEV Motion Lab, затем потребителей из строк таблицы. Неиспользуемые в продукте состояния проверяются только в Lab и не добавляют студенту фиктивные действия.
