# Контрастность

Фактические computed foreground/background значения и скриншоты не получены: браузерная автоматизация и axe недоступны. Поэтому таблица ниже фиксирует проверяемые пары, а не объявляет нарушения.

| Pair / state | Source | Theme | Threshold | Status |
|---|---|---|---:|---|
| `--foreground` on `--background` | `src/styles/tokens.css:8-21` | Light | 4.5:1 | Needs computed verification |
| `--foreground` on `--background` | `src/styles/tokens.css:46-59` | Dark | 4.5:1 | Needs computed verification |
| `--muted-foreground` on background/surface | `src/styles/tokens.css:18,52` | Both | 4.5:1 | Needs computed verification |
| semantic text on semantic soft background | `src/semantic-colors.css:3-71` | Both | 4.5:1 | Needs alpha/composite verification |
| border/input on adjacent surface | `src/styles/tokens.css:23-24,57-58` | Both | 3:1 when meaningful control boundary | Needs contextual verification |
| focus ring `--ring / .45` | `src/styles/components.css:21-24,161` | Both | 3:1 | Needs computed verification |
| hover `accent` with inherited foreground | feature CSS `:hover` rules | Both | 4.5:1 text | Needs state-by-state verification |

No foreground/background pair is reported as a confirmed WCAG failure without browser-computed colors and state evidence.

