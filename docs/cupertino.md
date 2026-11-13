# Cupertino adaptation

The interface adapts the geometry, control treatment and elevation of
[Cupertino for Obsidian](https://github.com/svnaxis/obsidian-cupertino).
Reference commit: `dd2e1bfa0b5e6e2200f880a32a138a87449687e5`.

The adaptation is integrated into the shared system described in [DESIGN.md](../DESIGN.md).
There is no separate override layer; `src/index.css` is the ordered style entry.
Shared shadcn/ui components expose `data-slot` hooks so the same rules apply
to controls and Radix surfaces rendered through portals.

The adaptation uses the existing NEW STUDENT color variables. It does not import
Cupertino's palette, SF Pro fonts, typography scale or animation timings.
Semantic colors, motion intensity, reduced motion, navigation and student
workflows remain managed by their existing implementations.

Universita is explicitly assigned through `data-typography="accent-title"`,
with font roles defined in `src/styles/typography.css`. UI text and small headings
inherit PT Root UI. See DESIGN.md for the permitted content accents.

Adapted elements:

- Smooth corners and consistent radii for controls, surfaces and dialogs.
- Fine inset edges and layered shadows for raised controls and overlays.
- Circular toolbar actions and a rounded global search field.
- Tabs, course filters, schedule filters, chat filters and theme choices use the
  same muted segmented surface with a raised selected item. Both Radix tabs and
  `SegmentedControl` expose shared slots; do not restyle them per screen.
- Desktop, collapsed and mobile navigation use the same inset rows, neutral
  selection, icon treatment and indentation. Mobile Radix portals receive the
  same sidebar class as desktop.
- Grouped settings rows, with inset dividers and room for touch controls.
- Raised chat composer, softly rounded course entities and reading callouts.

Global search is composed in `src/global-search.css`: one input above a recent
destinations rail, a category column and a results column. On phones the category
column becomes one scrollable row. It retains exact entity destinations, query
and category filtering, keyboard result selection and focus restoration.

Reference source files: `src/elements/cupertino.scss`,
`src/elements/cupertino-dialog.scss`, `src/elements/cupertino-settings.scss`,
`src/elements/baseline.scss`, `src/app/settings.scss` and `src/app/sidedock.scss`.

Upstream license: [MIT](licenses/obsidian-cupertino.txt).
