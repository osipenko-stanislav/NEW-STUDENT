# Settings surface

## Scope and direction

**Direction: Operate.** Settings extend the incumbent Central University LMS interface: compact grouped rows, restrained monochrome surfaces, explicit dividers, and familiar controls. The main LMS navigation and header remain available. This brief describes the implemented Settings surface only; it does not replace the product's identity or global design system.

The eight categories are **Общие**, **Внешний вид**, **Ввод и клавиши**, **Разговоры**, **Память**, **Библиотека**, **Данные и приватность**, and **О приложении**. The initial category is Общие. Switching categories clears transient feedback and resets the detail pane's scroll position. Category selection is component state, not a persisted preference.

## Visual language and typography

Reuse the existing `--background`, `--foreground`, `--muted`, `--muted-foreground`, and `--border` tokens in both themes. Selected navigation uses the muted surface; destructive actions use the existing red semantic tokens; the unavailable-memory note uses the slate semantic tokens. Group cards have 12px corners, separators between rows, and no shadow. The selected theme segment has only a small selection shadow. Lucide icons identify categories and selected rows without adding illustration.

Settings inherit **PT Root UI**, with the existing system sans-serif fallback. Category titles and row titles use 14px/20px at weight 500; descriptions use 13px/20px, with category descriptions at 12px/16px. The detail title uses 24px/32px at weight 600, becoming 22px/28px in the narrow layout. Group headings use 14px/20px at weight 600. Text size preferences multiply font sizes and line heights by **0.93**, **1**, or **1.12** through `--text-scale`; they do not scale shell dimensions. Keyboard hints inherit the UI font, and storage values use tabular numbers.

## Layout and responsive behavior

The workspace is an inline-size container. At full width, Settings use a **236px category rail** and a flexible detail pane. The rail and detail pane scroll independently. Detail content is centered within a 900px maximum width with 32px padding. Groups are separated by 28px; standard rows use 18px vertical and 20px horizontal padding.

Breakpoints depend on the available workspace width, including the effect of the LMS sidebar:

| Container width | Implemented behavior |
| --- | --- |
| 940px or less | Rail becomes 204px; detail padding becomes 28px × 24px; rows wrap and move most controls below their text. Switches remain beside their copy. |
| 680px or less | Rail becomes a labelled shadcn Select above the detail pane; detail padding becomes 24px × 20px with 40px below. |
| 360px or less | Horizontal padding becomes 16px; category Select fills the width and retains its accessible name; theme choices can wrap. |

The compact density preference reduces settings row vertical padding to 12px and category rows to a 52px minimum height with 8px vertical padding. It also changes existing navigation, search, study, conversation, and material-list rhythms through shared selectors.

## Controls and behavior

- **Общие:** Russian is the only language and its selector is disabled with an explanation. Date formats are long, numeric, or ISO; time is 24 or 12 hours. Formatting uses Moscow time and applies to schedule, deadlines, and file dates.
- **Внешний вид:** A RadioGroup selects system, light, or dark theme. System follows live device changes. Density and text size apply immediately. Orb animation is configurable; system reduced-motion preferences take priority.
- **Ввод и клавиши:** Send with Enter or Ctrl/⌘ + Enter; Shift + Enter adds a line. Browser spellcheck is configurable. Keyboard hints describe existing shortcuts.
- **Разговоры:** History can be collapsed, expanded, or hidden without deleting conversations. Confirmation for individual conversation deletion is configurable; bulk deletion always requires confirmation.
- **Память:** Both switches remain disabled and false. The explanatory note states that the assistant uses demonstration scenarios and does not remember conversational preferences. Local history is a separate feature.
- **Библиотека:** File count and summed file sizes come from actual material metadata. Site quota and persistence status use the browser Storage API; unknown quota is shown as undetermined. A persistence request reports the browser's decision and is disabled when unsupported.
- **Данные и приватность:** JSON export downloads the conversation snapshot with application name, export version, and timestamp. File contents are excluded. Preference reset restores defaults and system theme while retaining conversations and files.
- **О приложении:** Version comes from app metadata. Capability badges explicitly identify demonstration responses, disconnected AI/LLM and MCP, and device-local storage.

Use the existing shadcn Select, Switch, RadioGroup, Card, Separator, Button, Badge, and Dialog primitives. Category buttons expose `aria-current`; controls have accessible names; feedback uses `status` or `alert` roles. Bulk confirmations use an alert dialog and initially focus Cancel. While clearing, duplicate actions and dismissal are blocked. Failed actions keep the dialog open and show an error.

## Storage and destructive-action boundaries

Preferences are normalized against known values and stored in the versioned `student-settings:v1` localStorage record. Theme is separate in `student-theme:v1`. A preference save failure preserves the previous preference snapshot and reports an error; a theme save failure still applies the requested theme for the current session and reports that persistence failed.

Conversations use localStorage. File metadata and attachment relationships use the versioned `student-materials:v1` key; actual file Blobs use the `files` object store in the `student-material-files` IndexedDB database. File contents never enter localStorage. The library reports actual files, not a simulated usage number.

Bulk actions have separate confirmed scopes: clearing history retains library files; clearing the library retains conversation text but removes file availability and attachments; clearing application data removes NEW STUDENT's local conversations, files, preferences, and recent search transitions and opens a clean Navigator. Full reset drains pending library operations and remounts session providers after success. These actions operate on this device; do not imply account synchronization, cloud deletion, connected AI memory, or a file backup in JSON export.

## Source of truth

`src/components/SettingsScreen.tsx`, `src/components/SettingsProvider.tsx`, `src/settings.css`, `src/lib/settings-storage.ts`, `src/lib/display-formats.ts`, `src/App.tsx`, and `src/components/ThemeSwitcher.tsx` define this surface. Inherited typography and palette come from `src/index.css` and `src/semantic-colors.css`; storage boundaries come from `src/lib/material-metadata.ts`, `src/lib/material-files.ts`, and `src/lib/material-library.ts`.
