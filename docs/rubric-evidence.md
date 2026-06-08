# LearnSci Rubric Evidence Checklist

This checklist maps the summative rubric directly to project evidence.

## APP / KU

| Rubric item | Evidence for full marks |
| --- | --- |
| Overall class design | `lib/studyEngine.ts` defines `StudyNode`, `LessonNode`, and `StudyDeck`; each class has one clear responsibility. |
| Input/output handled correctly | Voice input, lesson selection input, OpenRouter API responses, audio output, tldraw visual output, progress JSON export/import. |
| Methods created and used correctly | `StudyDeck` methods are called by `createProgressLog()` and `createEvidenceSummary()`, which are used by the app settings modal. |
| GUI/classes complete and correct | `components/LearnSciWorkspace.tsx` provides the embedded lesson rail, setup modal, voice bubble, and tldraw canvas. |
| 2D arrays/data structures | `StudyDeck.build2DReviewGrid()` creates `string[][]` rows of lesson titles. Curriculum topics/items are structured arrays of typed objects. |
| Sort algorithm | `StudyDeck.selectionSortByDifficulty()` implements selection sort manually. |
| File input/output | Settings modal exports a JSON progress file with `Blob` and imports it with `FileReader`. |
| Search algorithm | `StudyDeck.binarySearchByTitle()` implements binary search and records probes. |
| Recursion algorithm | `StudyDeck.recursivePrerequisitePath()` uses a recursive helper to build prerequisite paths. |
| Program compiles and works | Verified with `npm run lint` and `npm run build`. App runs on `http://localhost:3000`. |
| Testing logs/daily log | See `docs/testing-log.md` and `docs/daily-log.md`. |
| Submitted on time | Repository commits show development progress and final pushed work on `main`. |

## THK

| Rubric item | Evidence for full marks |
| --- | --- |
| Object-oriented classes | `StudyNode` base class, `LessonNode` subclass, and `StudyDeck` manager class. |
| Thought process/planning/class links | See `docs/uml-diagram.md` and `docs/conference-progress-report.md`. |
| Creativity and organization | Minimal tldraw-based study canvas, voice tutor, curriculum packs, and clean lesson navigation. |

## COM

| Rubric item | Evidence for full marks |
| --- | --- |
| Comments/documentation | `lib/studyEngine.ts` documents classes, methods, sorting, search, 2D array, recursion, and file-log purpose. |
| Naming conventions | Components, methods, variables, and types use descriptive camelCase/PascalCase names. |
| UML relationships | See the Mermaid UML class diagram in `docs/uml-diagram.md`. |

