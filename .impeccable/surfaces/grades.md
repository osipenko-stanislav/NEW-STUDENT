# Student grade statements

The «Обучение → Ведомости» section follows the existing shadcn/ui theme, PT Root UI, shared controls, and semantic status badges. Figma supplies structure and data, not visual styling.

Sources: Figma file `JaZ00ePMPxJp0HN4IDfpZS`, student section `4842:161837`, calculation specification `6176:26538`. Individual source nodes are recorded in `src/data/grades.ts` (`gradeSources`). Current/archived lists retain the supplied titles, grades, semesters and enrollment formats, including repeated titles with distinct IDs.

The two subject-detail examples do not specify semester or enrollment format. They are available under «Курсы вне семестра» with unspecified format. Deep Learning has the supplied formula and nine task records. Introductory statistics has the supplied formula and completion counts. At the user’s subsequent request, subjects without a source breakdown now receive stable mock formulas and subject-specific task records. Their weights total 100%, activity averages match accepted task scores, and rounded totals preserve existing list grades. Previously missing grades use a mock average of 7. Rejected tasks have zero points and are excluded from completed counts and averages. Statistics receives mock task records matching its source averages and completed counts. Original Figma formulas and Deep Learning tasks remain intact. Mock provenance is documented here rather than adding demo-content labels to the interface.

The user explicitly chose recalculation when Figma total cells contradicted averages and weights. Each contribution is average × weight / 100. Contributions are summed before mathematical rounding to an integer; weights are not normalized and bonus rows are additive. Deep Learning: 2.98 → 3, total weight 77%. Statistics: 0 → 0, total weight 120% including bonus. Null grades display an em dash; zero remains zero. Formula averages are source values, not recomputed from the unrelated task example.

The list supports current/archive, semester/outside grouping, semester/format filters, title search, desktop column sorting, empty/reset states. Details use breadcrumbs → Back → title, then formula/earned tabs. Back retains list filters, scroll position and focus. Earned scores support activity/status/search filters and desktop sorting. Local React state follows the app's existing navigation; no backend or URL routing is added.

Below 700px available container width, lists and formulas become cards and tasks become expandable topic groups. Theme tokens support light/dark; text sizes respect `--text-scale`. Controls have labels, table headers expose sorting, results counts are announced, keyboard focus is visible, and touch controls have larger hit areas.

Implementation: `src/components/grades/GradesWorkspace.tsx`, `src/data/grades.ts`, `src/lib/grade-calculation.ts`, `src/grades.css`. Shell integration: `src/App.tsx`, `src/main.tsx`. Calculation regression tests: `tests/grade-calculation.test.ts`.

## Superseding shared-data update

The user subsequently chose «Мои курсы» and Handbook as the common catalog authority. The Figma-list and mock-breakdown descriptions above describe the earlier iteration. Current data comes from the shared registry documented in `study-data.md`: one current enrollment per canonical course, separate archive enrollments, derived grades from shared tasks, and the same material links as courses and chat. Figma-only subjects and duplicated catalog entries are no longer shown.
