# Покрытие аудита

## Окружение

- Repository: `/Users/st.osipenko/Desktop/vscode/NEW STUDENT`
- HEAD: `63e7517b05e216b0e2ac6106e372783b81ffe9e7`
- Worktree dirty: да; существующие изменения не трогались.
- Browser automation: недоступна (`playwright`, `@playwright/test`, `axe-core` не установлены).
- Browser screenshots/computed styles: не получены.

## Статически просмотрено

- Navigator home, assistant shell, Generative UI, global search.
- Course catalog, course program, lesson reading, homework, submission form, Late Days and deadline actions.
- Schedule, grades, handbook, materials/library, notifications, settings.
- Dialog, Sheet, Popover, Dropdown, Select, Calendar and Status Island primitives.
- Light/dark token definitions and motion/reduced-motion rules.

## Не подтверждено runtime-проверкой

- Viewports: 375×812, 768×1024, 1366×768, 1440×900.
- Hover, focus, selected, active, disabled, loading, error, empty, success states in browser.
- 200%/400% browser zoom, 200% text resize, compact density.
- Computed contrast, bounding boxes, focus-obscured and focus-return behavior.
- VoiceOver/NVDA or another screen reader.
- Browser support/fallback comparison for `corner-shape: superellipse(1.1)`.

## Acceptance note

Этот пакет является доказательным статическим аудитом с явными ограничениями. Для формального WCAG 2.2 AA заключения необходимы браузерные измерения и ручная клавиатурная/скринридерная проверка.
