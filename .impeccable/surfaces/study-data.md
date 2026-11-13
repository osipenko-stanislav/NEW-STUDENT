# Shared academic data

The user chose the existing 16-course «Мои курсы» catalog as the common pool and Handbook as academic authority. `src/data/course-catalog.ts` holds canonical course IDs, names, available levels, categories and source links. No additional Figma-only subjects are added to the current catalog. Course category assignments, enrollments and student records are prototype fixtures.

`src/data/course-content.ts` retains the Handbook Machine Learning thematic plan, assessments and previously populated lesson content. Machine Learning uses 30% homework, 30% colloquiums, 20% project and 20% exam. Other course assessment profiles and brief learning materials are mocks rather than claims to reproduce official syllabuses.

`src/data/academic-data.ts` is the shared registry for enrollments, tasks, materials and projections. Each record owns a canonical course ID; tasks also own an enrollment ID. Accepted task grades determine activity averages and completed counts. Weighted averages determine the statement total. Course progress uses the exact same statement calculation; pending/submitted tasks have null grades. Archive records have separate task IDs and enrollment IDs. Only current pending/submitted tasks appear in deadline widgets and assistant homework responses.

The current pool contains one enrollment per catalog course, with internal courses outside semesters. Four historical mock enrollments refer to the same course catalog. Figma-only duplicate lists were replaced by this projection. The standalone Figma arithmetic fixtures remain in `grade-fixtures.ts` solely as calculation regression examples and source provenance; they are not a separate visible course catalog.

`study-seed.ts` supplies fixed-week schedule and task inputs. Python names resolve to `python-basic`. Previous linear-algebra examples were replaced by discrete-mathematics content, with stable legacy item IDs retained for saved cards. This is a content replacement, not an assertion that the two subjects are equivalent. Assistant schedule entries include Machine Learning classes from the course content when they fall within the demonstration week.

`academicMaterials` includes real local PDF, IPYNB and Markdown files. `materialsForCourse` feeds course pages, lesson references, grades, assistant material results and search. Courses without earlier files have short local mock study guides. They are not official Handbook downloads. User-uploaded chat attachments remain in the existing local material library and are not rewritten or merged into academic fixtures.

The compatibility modules `courses.ts`, `grades.ts` and `study-demo.ts` expose projections of the shared records. Search indexes all 16 courses rather than only the next four classes. Links carry a canonical course ID through existing local React navigation. Course grade actions open the actual statement. Assistant results offer the owning course and actual file. `resolveStudyPart` refreshes restored card snapshots by ID without mutating saved conversation text or trusting stored file URLs; records outside the chosen catalog are omitted from rendered study cards.

Checks: `tests/academic-data.test.ts` covers catalog equality, unique IDs, task averages, completed counts, archive isolation, course assessment weights, pending task consistency, real files, material ownership, every canonical course in assistant queries and restored-card resolution.

## Curricula and reading across all courses

At the user's explicit request, all 16 courses now expose curricula and readable lessons. `course-curricula.ts` selects the existing Machine Learning program (four blocks / fifteen topics) or builds three subject-specific blocks for another catalog course. Each block links the same task IDs and material IDs used by the shared registry. `lecture-content.ts` contains 45 authored prototype notes, each with an explanation, worked example and exercise. These are not official Handbook lecture transcriptions.

`CourseProgram` and `CourseProgramPanel` accept the selected course's blocks and lessons. `CourseLessonReader` displays the additional subjects with the existing shadcn reading layout, section navigation, materials, linked task dialog and previous/next navigation. Machine Learning continues to use its existing longread. The course sidebar derives progress/deadlines from the same course record in every subject. Subject-specific video tabs show an empty state when no recordings exist rather than displaying Machine Learning recordings.

Browser verification opens a lesson in every course, checks subject content, program switching, boundary navigation and the mobile panel. `tests/courses.test.ts` verifies curriculum references and text coverage in addition to the earlier Machine Learning sequence checks.

## Course tabs and download demonstration

Course overview tabs are now exactly: «Курс», «Домашки», «Видеозаписи», «Материалы», «Ведомость по курсу». The course tab contains the curriculum. Homework selects homework activities from the shared task registry, including bonus homework, and supports status filtering. The compact statement lists task scores and statuses without the assessment formula and opens the main statement for this course. Lesson reading and its curriculum panel remain available.

Material actions can add a file to the chat library and select it for the current conversation/draft. Academic source IDs survive metadata serialization; repeat imports reuse the existing file. This action uses the local asset and existing IndexedDB library, preserving the current composer and conversation. User-uploaded files are not matched merely by filename.

The user explicitly changed the downloading requirement to a demonstration view with a simulated process. `DownloadDemoProvider` creates no download, archive, directory handle or filesystem writes. Global pack and per-file download actions show a progress dialog, cancellation and retry. Pack counts derive from the actual shared pool (16 courses, 60 lessons, 17 files). The settings Library category has a demo repository-path input, auto-sync switch, 15/30/60-minute period, manual sync and last-demonstration time. Automatic runs are simulated while the application is open/visible. The folder is only a saved display value, not an OS directory selection. The interface labels the flow as a demo and states that files are not created.

Folder/interval settings use the existing versioned settings store; last-demo time has its own versioned local key included in full reset. No new dependencies were introduced. Browser checks cover five-tab order, isolated content, homework filtering, compact/full statements, importing without duplicates, progress/cancellation, auto/manual simulation, reload persistence, mobile layout and absence of browser download events. Accessibility checks for tabs, settings and progress had no reported WCAG A/AA violations in the checked states.
