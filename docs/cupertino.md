# Cupertino adaptation

The interface adapts the geometry, control treatment and elevation of
[Cupertino for Obsidian](https://github.com/svnaxis/obsidian-cupertino).
Reference commit: `dd2e1bfa0b5e6e2200f880a32a138a87449687e5`.

`src/cupertino.css` is the adaptation layer, loaded after the product styles.
Shared shadcn/ui components expose `data-slot` hooks so the same rules apply
to controls and Radix surfaces rendered through portals.

The adaptation uses the existing NEW STUDENT color variables. It does not import
Cupertino's palette, SF Pro fonts, typography scale or animation timings.
The product's typography, semantic colors, motion intensity, reduced motion,
navigation and student workflows remain managed by their existing implementations.

Adapted elements:

- Smooth corners and consistent radii for controls, surfaces and dialogs.
- Fine inset edges and layered shadows for raised controls and overlays.
- Circular toolbar actions and a rounded global search field.
- Related tabs within a single outlined group, retaining their original colors.
- Grouped settings rows, with inset dividers and room for touch controls.
- Raised chat composer, softly rounded course entities and reading callouts.

Reference source files: `src/elements/cupertino.scss`,
`src/elements/cupertino-dialog.scss`, `src/elements/cupertino-settings.scss`,
`src/elements/baseline.scss`, `src/app/settings.scss` and `src/app/sidedock.scss`.

Upstream license: [MIT](licenses/obsidian-cupertino.txt).
