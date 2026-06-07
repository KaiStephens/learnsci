# LearnSci

Minimal ICS4U study workspace with an OpenRouter voice tutor, sanitized Classroom-derived curriculum map, and an Obsidian-style drawing canvas.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your OpenRouter API key to `.env.local`. The browser never receives the key; all model calls run through local Next.js API routes.

## OpenRouter Voice Pipeline

LearnSci uses a three-stage backend pipeline through OpenRouter:

1. `microsoft/mai-transcribe-1.5` for speech-to-text.
2. `openai/gpt-5.4-mini` for fast tool-calling tutoring.
3. `microsoft/mai-voice-2` for text-to-speech.

Put one OpenRouter key in `.env.local`:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

`OPENAI_API_KEY` is also accepted as a local alias for compatibility, but the Microsoft MAI models are OpenRouter models, so an OpenRouter key is the correct key.

The browser never receives the API key. Voice turns go through `app/api/tutor/voice/route.ts`; typed turns go through `app/api/tutor/chat/route.ts`.

## Curriculum Privacy

The committed curriculum is a sanitized outline inferred from Classroom topic names, assignment titles, due dates, and broad skills. Private attachments, submissions, and teacher-authored instructions are intentionally not committed. Put any private exported curriculum in `data/*.local.json`, which is ignored by git.

## Conference / Rubric Evidence

The app includes a compact **Rubric Proof** panel in the floating sidebar.

- **Draw proof** adds a tldraw diagram showing project evidence for OOP, 2D arrays, sorting, searching, recursion, and file I/O.
- **Export** downloads a JSON progress log.
- **Import** reads a previously exported progress log JSON.

Concrete programming evidence lives in `lib/studyEngine.ts`:

- `StudyNode`, `LessonNode`, and `StudyDeck` show classes, constructors, inheritance, and overridden methods.
- `build2DReviewGrid()` demonstrates a 2D array/data-structure view of the lessons.
- `selectionSortByDifficulty()` implements a sort algorithm.
- `binarySearchByTitle()` implements a search algorithm.
- `recursivePrerequisitePath()` includes recursion.
- The sidebar export/import controls provide browser file output and input.

The conference progress report is in `docs/conference-progress-report.md`.
