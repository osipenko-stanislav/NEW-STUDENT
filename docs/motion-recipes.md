# Crafted microinteraction contracts

Источники параметров: `src/lib/motion-recipes.ts`, `motion-tokens.ts` (существующая оболочка и пружины). Потребители перечислены в [инвентаризации](motion-component-inventory.md). Каталог в локальном Vite: `http://127.0.0.1:5173/?motion-lab=1`. В production маршрут и lazy import исключаются; в меню его нет. Это части существующего приложения с теми же провайдерами и компонентами.

## Notification Badge Bell Ring

Источник: [Transitions.dev, Notification badge bell ring](https://transitions.dev/studio.html?id=c255dRhbki0). Публичный iframe TSX/CSS изучен непосредственно в Chrome. Перенесена хореография; сохранены размеры header и семантические цвета NEW STUDENT.

| Часть | Контракт Balanced |
| --- | --- |
| Bell | 900 ms, 18°, cubic-bezier(.36,.07,.19,.97), origin 50% 15% |
| Колебания | 0 → +18° (15%) → −15.3° (30%) → +10.8° (45%) → −7.2° (60%) → +3.24° (78%) → 0° |
| Slide | X −8.2 px, Y +12.4 px → 0, 260 ms, cubic-bezier(.22,1,.36,1) |
| Pop | scale 0 → 1, blur 2 px → 0, 500 ms, cubic-bezier(.34,1.36,.64,1), origin center |
| Fade | opacity 0 → 1, 400 ms, одновременно со slide/pop |
| Close | scale 1 → 0, blur 0 → 2 px и opacity 1 → 0, обе фазы 180 ms, cubic-bezier(.4,0,.2,1) |
| Цифры | Только изменившийся разряд, 500 ms, 8 px, blur 2 px, cubic-bezier(.34,1.45,.64,1), stagger 70 ms |
| Press | scale .97, 150 ms, cubic-bezier(.22,1,.36,1); popover сохраняет обычный сценарий |

Idle/restored: без ring и enter. Hover: общий акцент кнопки, без звонка. New unread increase: один новый ключ bell, повторный прирост прерывает прежнее колебание и запускает новое. Уменьшение счётчика меняет цифры, но не звонит. Zero: согласованный exit badge; повторное событие во время exit восстанавливает тот же Presence key. Open popover не меняет unread и не считается новым событием. Success/error действия прочтения определяет существующая модель, а не анимация.

Expressive сохраняет длительности и увеличивает амплитуду на 12%. Minimal/reduced: итоговое значение сразу, без ring, slide, scale, blur или rolling. Badge остаётся читаемым; описание количества для скринридера находится у кнопки.

Звук — optional API `soundContext`/`soundEnabled` компонента. По умолчанию выключен, production header не создаёт AudioContext. Существующей категории настроек уведомлений в приложении нет; новый студенческий переключатель в другом разделе не добавлялся. В Motion Lab отдельное нажатие включает/возобновляет AudioContext. Только последующее увеличение unread даёт два тона 880/1318.5 Hz с интервалом 130 ms и затуханием 700 ms. Загрузка, открытие popover и включение звука сами по себе не воспроизводят сигнал. Повторное событие останавливает прежние voices, завершённые nodes отключаются, при уходе Lab context закрывается. Ограничения autoplay сохраняются.

## Контракты остальных объектов

Все значения ниже — независимые миллисекунды, не множитель длительности интерфейса. В таблице опущены состояния, которых нет у объекта. `exit` — самостоятельный короткий переход. При minimal/reduced логическое состояние применяется сразу; нативные focus, aria, disabled и сообщения ошибок сохраняются. Expressive увеличивает только локальную амплитуду (обычно ×1.25); switch имеет отдельную пружину.

| Объект | Idle / hover / press / active | Loading / success / error / reset | Timing / easing / origin / amplitude | Повторный запуск |
| --- | --- | --- | --- | --- |
| IconButton | Стабильный размер, semantic hover; icon press .97 | Open определяется Radix; disabled не двигается | 150 ms, прежний общий micro; center; 2 px Balanced / 3 px Expressive | CSS transition прерывается с текущего значения |
| Arrow / gear / trash / plus | Стрелки по направлению, gear 8°/14°, trash −8°/−14°, Plus 45° только open | Reset при уходе/open=false; декоративные SVG статичны | 150/180 ms micro; center | Нет таймеров; pointer fine только hover |
| StateIcon | Только изменившееся состояние; icon остаётся в слоте 16×16 | Success Check draw; error Triangle, exit предыдущего glyph | Swap 160/120 ms, cubic-bezier(.22,1,.36,1), center; scale .8→1, rotate −8→0 | State/revision key, initial=false; одинаковый state не replay |
| Pin | Outline → fill + импульс .94→1.08→1 | Unpin scale exit .85, outline; никакого bounce строки | 180/120 ms, cubic-bezier(.34,1.25,.64,1), center | Actual pinned state; restored pin не проигрывает enter |
| Checkbox | Fill/outline, SVG dash 24→0; mixed отдельный штрих | Снятие восстанавливает dash; disabled стандартный | Draw 180/120 ms cubic-bezier(.16,1,.3,1); fill micro, center | Нативный input немедленно принимает Space/клик; соседние строки инертны |
| Radio | Dot opacity 0→1, scale .6→1, без движения ряда | Unchecked обратный transition; segmented variant общий pill | 160/120 ms cubic-bezier(.22,1,.36,1), center | Radix arrows/roving focus; forceMount даёт обратный transition |
| Switch | Thumb x0↔16, локальный press scale1.08/.94; цвет track | on/off без асинхронного успеха | Balanced spring stiffness700/damping38/mass.5; Expressive650/29/.5; center | Управляемый или native local state, новая цель прерывает spring |
| Tabs / segments | Общий indicator следует x/y/width/height активного контрола | Нет искусственного loading; содержимое остаётся существующим | 180/120 ms cubic-bezier(.4,0,.2,1); top-left геометрии | Mutation/ResizeObserver + fonts; только одна цель, cleanup при unmount |
| Accordion / disclosure | Chevron180°, дерево90°; естественная высота | Close сохраняет DOM до завершения; закрытые ссылки inert | Height220/180 ms cubic-bezier(.25,.1,.25,1); origin center для chevron | Native interpolate-size/allow-discrete; fallback мгновенный в старых браузерах; grid disclosure прерываем |
| Dropdown / select | Origin-aware surface, item highlight; chevron180°, selected Check | Closed собственный exit, disabled стандартный | Menu160/120 ms cubic-bezier(.16,1,.3,1); Radix transform-origin | Radix сохраняет focus/keyboard/outside; no custom timeout |
| Popover / Sheet / Dialog | Существующий origin-aware/macro профиль сохранён | Локальные контролы независимы от surface | Существующие профили motion-tokens; overlay fade и surface отдельно | Radix open/closed, interrupted actions не ждут exit |
| Tooltip | Небольшой directional entry, pointer/focus | Exit короткий; не задерживает действие | 120/80 ms cubic-bezier(.22,1,.36,1), Radix origin, 2 px | Radix управляет delay/open; minimal только opacity |
| Field / clear | Border/focus/placeholder; место clear зарезервировано | Invalid border, сообщение; clear возвращает focus | 120/80 ms cubic-bezier(.2,0,0,1); без движения введённого текста | Изменения ввода мгновенные; анимируется только clear/outline |
| Stepper | Нативный ввод и +/−, press на кнопках | Limits/disabled; derived значения отдельно | Press micro, Counter220 ms; input не rolling, чтобы сохранять caret | Каждый клик немедленно меняет значение, no debounce/throttle |
| Counter / grade / timer | Стабильные слоты цифр; unchanged glyph тот же DOM | Increase/decrease задаёт направление; SR-only целое значение | 220/140 ms cubic-bezier(.22,1,.36,1), 2/3 px; origin center | Только новый digit key, initial=false; максимум ширины удерживается до unmount |
| Badge / status | Переход семантического фона/текста, локальные icon/label | Состояние из модели; родитель не replay | Status180/120 ms cubic-bezier(.22,1,.36,1); 2 px; reserved label choices | Только изменение text/variant; WAAPI cancel предыдущего feedback, cleanup |
| Action / export / save | Стабильный slot и зарезервированная ширина всех подписей | Реальная Promise: idle→loading→success/error; Check900 ms→idle, error остаётся до retry | Action160/120 ms cubic-bezier(.22,1,.36,1); center; spinner800 ms только busy | busy ref предотвращает double submit, alive guard и cleanup feedback timer; нет искусственного ожидания |
| Sync | Idle Refresh; active loop, плавное торможение до полного оборота | Actual provider current после syncing → Check900 ms→Refresh; error Triangle | Разгон220 ms cubic-bezier(.4,0,1,1), loop1200 ms linear, brake220 ms cubic-bezier(.22,1,.36,1); center; icon swap160/120 | Motion controls.stop при смене состояния/unmount; idle не тратит RAF; minimal статичная иконка + progress |
| Copy | Copy→Check в том же слоте | Только выполненный Clipboard; error Triangle, retry; reset900 ms | Swap160/120 ms, Check draw180 ms; center | Success revision позволяет повторить до reset; таймер очищается/перезапускается |
| Progress | Значение из модели, локальная width/transform | Не скрывается при reduced; нет delayed result | 180/120 ms cubic-bezier(.4,0,.2,1); left origin | Новое значение прерывает transition; тысячи строк не анимируются |
| File / attachment | Semantic menu hover; добавление и удаление строки | Exit без выхода всей панели; reorder только layout position | 180/140 ms cubic-bezier(.16,1,.3,1), 4/5 px; layout spring общий micro | Presence initial=false; stable id keys, повторное открытие не replay всей ленты |
| Calendar | Нативный редактируемый date fallback + Radix popup; selected pill local | Месяц меняет только сетку, выбор даты не replay сетки | 180/120 ms cubic-bezier(.22,1,.36,1), 6/7.5 px; center | 42 слота/6 недель, фиксированная высота, roving arrows/Home/End/PageUp/Down; minimum/maximum сохранены |
| Voice | Mic→Stop→Spinner, локальный таймер | Recording/transcribing/cancel существующей модели | StateIcon/Counter + существующий busy spinner | Нет новых ожиданий; отмена и размонтирование прекращают существующий сценарий |
| Gen UI / Late Days | Общие Checkbox/Stepper/Counter/Status | Подтверждение из существующей транзакции; ошибка не превращается в Check | Соответствующие независимые рецепты выше | Корневой блок не key от баланса/выбора; двойное применение защищено существующей моделью |

## Границы применения

Нет бизнес-действия сохранения глобальных закладок и звёзд уровней: декоративные значки не превращены в Like/Bookmark. Нативные файловый диалог и редактирование date сохраняются. Таблицы не получают массовых enter/layout анимаций при сортировке. Новые библиотеки не добавлены. Служебный сброс контекста по логотипу не изменён.

## Проверка

Состояния проверяются в Motion Lab и затем у реальных потребителей. Автоматизированная браузерная матрица покрывает 1366/375 px × light/dark × minimal/balanced/expressive. Отдельный проход — reduced motion, реальные ошибки Clipboard/sync, Gen UI, восстановление и внешнее изменение unread, мобильный календарь и стабильность геометрии. Результаты фиксируются в инвентаризации по завершении прохода.
