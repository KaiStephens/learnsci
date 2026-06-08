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

## First-Run Setup

On first launch, LearnSci asks what it should teach. The built-in packs are:

- ICS4U Computer Science
- Math Review
- Science Review
- Humanities Review
- Custom Subject

Custom lessons can be pasted one per line. Add a resource by separating the lesson title and URL with a pipe:

```text
Photosynthesis | https://example.com/video
Cellular respiration
Energy transfer
```

The chosen subject is saved in browser local storage and sent to the tutor with each chat or voice turn, so the same canvas tutor can adapt beyond computer science.

## Curriculum Privacy

The committed curriculum is a sanitized outline inferred from Classroom topic names, assignment titles, due dates, and broad skills. Private attachments, submissions, and teacher-authored instructions are intentionally not committed. Put any private exported curriculum in `data/*.local.json`, which is ignored by git.

## Conference / Rubric Evidence

The app keeps rubric evidence out of the main lesson rail so the interface stays minimal. Open the setup/settings modal with the gear button, then expand **Project evidence**.

- **Export progress JSON** downloads a project progress log.
- **Import progress JSON** reads a previously exported log with `FileReader`.
- The evidence summary lists OOP object count, 2D grid rows, sorting output, binary-search probes, and recursive prerequisite steps.

Concrete programming evidence lives in `lib/studyEngine.ts`:

- `StudyNode`, `LessonNode`, and `StudyDeck` show classes, constructors, inheritance, and overridden methods.
- `build2DReviewGrid()` demonstrates a 2D array/data-structure view of the lessons.
- `selectionSortByDifficulty()` implements a sort algorithm.
- `binarySearchByTitle()` implements a search algorithm.
- `recursivePrerequisitePath()` includes recursion.
- The setup modal export/import controls provide browser file output and input.

Supporting submission documents:

- `docs/rubric-evidence.md`
- `docs/uml-diagram.md`
- `docs/testing-log.md`
- `docs/daily-log.md`
- `docs/conference-progress-report.md`
