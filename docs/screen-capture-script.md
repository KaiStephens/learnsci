# LearnSci Screen Capture Script

This guide is for the summative screen recording submission. Google Classroom shows a screen recording submission post due June 10, 2026 with the instruction to attach recordings or links. The project plan also says the screen capture should demonstrate how to navigate the application, how the class is built, and evidence of object-oriented programming, constructors, inheritance, polymorphism, sorting, searching, recursion, and other course topics.

The cleanest submission is two videos:

1. Product demo: show what LearnSci is and how to use it.
2. Code and rubric walkthrough: show exactly where each rubric requirement is implemented.

If Classroom only accepts one file or link, record these in the same order as one longer video.

## Before Recording

Open these before starting:

- App: `http://localhost:3000`
- Project repo or code editor: `/Users/kaistephens/code/learnsci`
- Rubric checklist: `docs/rubric-evidence.md`
- UML diagram: `docs/uml-diagram.md`
- Testing log: `docs/testing-log.md`
- Daily log: `docs/daily-log.md`
- Main OOP/algorithm file: `lib/studyEngine.ts`
- Main interface file: `components/LearnSciWorkspace.tsx`
- AI/tool-calling backend: `lib/openrouter.ts`
- Curriculum/resources file: `lib/curriculum.ts`
- Optional API routes: `app/api/tutor/chat/route.ts` and `app/api/tutor/voice/route.ts`

Run or show these commands if you want proof that the app works:

```bash
npm run lint
npm run build
npm run dev
```

Use `http://localhost:3000` for the app. If the tldraw board has old drawings on it, select them and delete them before recording so the canvas starts clean.

## Video 1: Product Demo

Target length: 4-6 minutes.

### 1. Opening

Start on `http://localhost:3000`.

Script:

> This is LearnSci, my Grade 12 ICS4U culminating project. It is a minimal visual study application built around a tldraw canvas. The purpose is to help review computer science lessons by combining lesson navigation, public course resources, a drawing workspace, and a voice-based tutor that can create diagrams on the board.

Point out:

- The embedded lesson sidebar on the left.
- The main tldraw canvas.
- The talk bubble in the bottom right.
- The first-boot setup if it appears.

### 2. Show The First-Boot Setup

Click the settings button if setup is not already open.

Script:

> When the app first boots, it asks what subject to study. The default pack is my ICS4U computer science curriculum, but the same app can adapt to another subject. A user can choose a built-in pack or paste custom lessons line by line. This means the project is not locked to only one unit.

Show:

- `Computer Science ICS4U`
- `Custom Subject`
- The custom lesson input if you want to demonstrate adaptability.
- Click `Start studying`.

### 3. Show Lesson Navigation

Use the left sidebar.

Script:

> The left side is organized by units. Each unit expands into lessons, and I removed assignment-style clutter so the app focuses on studying. When I click a lesson, the selected lesson updates with a review prompt, key skills, and any useful public resources.

Click through these examples:

- `Java Foundations` -> `2D Arrays Recap`
- `Object Oriented Programming` -> `UML Diagrams`
- `Object Oriented Programming` -> `Polymorphism and Interfaces 4/5`
- `Sorting, Searching, and Mazes` -> `2D CSV Sorting and Searching`
- `Recursion` -> `Recursion Intro`
- `Graphics, GUI, Vibecoding` -> `Java Graphics`

For resources:

> Some lessons include videos or websites that were added from the course material, but private Classroom attachments and student-only files are not stored in the public repo.

### 4. Show The tldraw Workspace

Use the canvas tools briefly.

Script:

> The main workspace is tldraw, so every diagram is editable. The user can draw manually, move shapes, erase, write notes, and organize visual explanations. This is useful for topics like arrays, UML, recursion call stacks, sorting traces, and maze paths.

Draw or move one simple shape if needed.

### 5. Show The AI Tutor Flow

Click a lesson, then click `Start lesson`. If your microphone/API is working, click the `Talk` bubble and say:

> Draw a clear diagram that explains a 2D array with rows, columns, and nested loops.

Script while it runs:

> The tutor sends the selected lesson, current board summary, and recent messages to the backend. The model can call drawing tools, and the frontend converts those tool calls into editable tldraw shapes. It is not limited to preset diagrams; it can create boxes, code blocks, arrows, labels, grids, and concept maps based on the lesson.

If the voice API is not available during the recording:

> The interface is still ready for the voice flow: microphone input goes to the voice API route, speech is transcribed, the tutor reasons and calls tools, and the result is drawn on tldraw.

### 6. Show Project Evidence Controls

Open settings and expand `Project evidence`.

Script:

> The project evidence section is intentionally hidden in settings so the main app stays minimal. It summarizes rubric requirements from the actual curriculum data. It shows lesson objects, a 2D review grid, sorted lessons, binary-search probes, and recursive prerequisite steps.

Click `Export progress JSON`.

Script:

> This is the file output part of the project. The app exports a JSON progress log. The import button reads a JSON file back in using file input, so the project includes browser-based file input and output.

### 7. Product Demo Closing

Script:

> Overall, the app meets the product goal because it is a working study application with a GUI, a drawing environment, lesson navigation, AI-assisted explanations, voice interaction, file import and export, and course-specific computer science review content.

## Video 2: Code And Rubric Walkthrough

Target length: 7-10 minutes.

### 1. Start With The Rubric Checklist

Open `docs/rubric-evidence.md`.

Script:

> For the code walkthrough, I made a rubric checklist that maps each marking category to specific project evidence. I am going to show the files that prove the app has object-oriented design, input/output, methods, GUI, data structures, sorting, searching, recursion, testing logs, daily logs, and a UML diagram.

### 2. Show The UML Diagram

Open `docs/uml-diagram.md`.

Script:

> This is the UML diagram for the project. `StudyNode` is the base class. `LessonNode` extends `StudyNode`. `StudyDeck` manages many `LessonNode` objects. `LearnSciWorkspace` uses the curriculum, the study deck, the tldraw canvas, and the tutor API routes. The diagram shows inheritance, composition, and dependency relationships.

Mention:

- `StudyNode <|-- LessonNode` shows inheritance.
- `StudyDeck *-- LessonNode` shows composition.
- `LearnSciWorkspace --> TutorApiRoutes` shows the frontend/backend connection.

### 3. Show Object-Oriented Classes

Open `lib/studyEngine.ts`.

Go to the top of the file.

Script:

> This file contains the clearest object-oriented evidence. The project uses TypeScript classes to model study content and rubric evidence.

Show:

- Lines 29-43: `StudyNode`
- Lines 45-64: `LessonNode`
- Lines 66-86: `StudyDeck`

Script:

> `StudyNode` is the parent class. Its constructor stores the shared `id` and `title`. `LessonNode` extends `StudyNode`, calls `super(id, title)` in its constructor, and adds skills, difficulty, and level. `StudyDeck` is a manager class that converts curriculum topics into lesson objects.

### 4. Show Constructors

Stay in `lib/studyEngine.ts`.

Script:

> Constructors are used in all three classes. `StudyNode` initializes basic node data. `LessonNode` initializes the inherited fields through `super` and then stores lesson-specific data. `StudyDeck` takes curriculum topics and constructs a list of `LessonNode` objects.

Point to:

- `constructor(public readonly id: string, public readonly title: string)`
- `super(id, title)`
- `new LessonNode(...)`

### 5. Show Inheritance And Polymorphism

Stay in `lib/studyEngine.ts`.

Script:

> Inheritance is shown by `LessonNode extends StudyNode`. Polymorphism is shown because both classes have a `label()` method. The child class overrides the parent version, so a `LessonNode` can be treated as a `StudyNode` but return a more detailed label.

Point to:

- `StudyNode.label()`
- `LessonNode.label()`

### 6. Show 2D Arrays / Data Structures

Go to `build2DReviewGrid()`.

Script:

> This method is the explicit 2D array evidence. It creates `rows` as `string[][]`. Each row holds lesson titles, and the method groups lessons into rows based on the column count. This connects directly to the 2D array unit because it uses row indexes and nested list structure.

Point to:

- `const rows: string[][] = [];`
- `const row = Math.floor(index / columns);`
- `rows[row].push(lesson.title);`

Also mention:

> The curriculum itself is stored as typed arrays of objects in `lib/curriculum.ts`, so the app also uses structured data beyond simple variables.

### 7. Show Sorting

Go to `selectionSortByDifficulty()`.

Script:

> This is the sorting algorithm evidence. I intentionally wrote selection sort manually instead of just using the built-in sort method. The outer loop chooses a position, the inner loop finds the minimum difficulty lesson, and then the method swaps the items.

Point to:

- Outer loop `for (let i = 0; i < sorted.length - 1; i += 1)`
- Inner loop `for (let j = i + 1; j < sorted.length; j += 1)`
- Swap `[sorted[i], sorted[minIndex]] = [sorted[minIndex], sorted[i]]`

### 8. Show Searching

Go to `binarySearchByTitle()`.

Script:

> This is the search algorithm evidence. The lessons are alphabetically sorted by title first, then binary search checks the middle item and moves either left or right. The method also records every probe, which is useful for testing and explaining how the algorithm worked.

Point to:

- `let low = 0`
- `let high = sorted.length - 1`
- `const mid = Math.floor((low + high) / 2)`
- `comparison < 0`
- `return { found: true, index: mid, probes }`

### 9. Show Recursion

Go to `recursivePrerequisitePath()`.

Script:

> This is the recursion evidence. The nested helper function calls itself with `index - 1` until it reaches the base case. Then it builds the prerequisite path back up from Java Foundations to the target unit.

Point to:

- Base case: `if (index <= 0) return [path[0]];`
- Recursive call: `return [...buildPath(index - 1), path[index]];`

### 10. Show File Input / Output

Open `components/LearnSciWorkspace.tsx`.

Go to `exportProgressLog()` and `importProgressLog()`.

Script:

> The app handles browser file output by creating a JSON blob and triggering a download. It handles file input by reading a selected JSON file with `FileReader`, parsing it, and summarizing the imported evidence.

Point to:

- `createProgressLog(activeCurriculum, boardSummary())`
- `new Blob([JSON.stringify(log, null, 2)])`
- `link.download = ...`
- `const reader = new FileReader()`
- `JSON.parse(...)`

### 11. Show GUI / Graphics

Stay in `components/LearnSciWorkspace.tsx`.

Script:

> This file is the main GUI. It manages the setup modal, lesson sidebar, selected lesson state, voice bubble, tldraw canvas, and tutor responses.

Point to:

- State setup around `useState`
- Lesson sidebar JSX around `lesson-rail`
- Lesson list around `unit-accordion`
- tldraw canvas around `Tldraw`
- Voice bubble button around `voice-bubble`

Then go to `drawCanvasOnTldraw()`.

Script:

> This function converts tutor tool calls into actual editable tldraw shapes. It creates boxes, text, code blocks, arrows, and labels. It also calculates bounds and places generated visuals with spacing so diagrams are readable.

Point to:

- `drawCanvasOnTldraw(editor, drawing)`
- `editor.createShapes(shapes)`
- `zoomToGeneratedBounds(editor, bounds)`

### 12. Show Backend And Tool Calling

Open `lib/openrouter.ts`.

Script:

> This is the backend model layer. The app defines tutor tools that the model can call. The most important one is `draw_canvas`, which lets the model draw any visual using coordinates, text, boxes, code blocks, and arrows.

Point to:

- `tutorTools`
- `draw_canvas`
- `buildTutorSystemPrompt()`
- `runTutorTurn()`
- `transcribeAudio()`
- `synthesizeSpeech()`

Script:

> The voice flow is: record audio in the frontend, send it to the voice API, transcribe it, run the tutor turn, apply tool calls to tldraw, and optionally synthesize speech back to the user.

Optional: open `app/api/tutor/chat/route.ts` and `app/api/tutor/voice/route.ts`.

Script:

> These API routes keep the API key on the server side. The browser does not directly expose the key.

### 13. Show Curriculum And Course Resources

Open `lib/curriculum.ts`.

Script:

> This file stores the sanitized study curriculum. It includes the main course units: Java Foundations, Object Oriented Programming, Sorting and Searching, Recursion, and Graphics/GUI. The resources are public videos and websites connected to the lessons. Private Classroom attachments and student data are not committed.

Point to:

- `classroomScan`
- `Java Foundations`
- `Object Oriented Programming`
- `Sorting, Searching, and Mazes`
- `Recursion`
- `Graphics, GUI, Vibecoding`
- Example resources like 2D array videos, UML videos, sorting resources, recursion resources, Java graphics resources.

### 14. Show Testing And Daily Logs

Open `docs/testing-log.md`.

Script:

> This is my testing log. It shows that I tested app startup, OpenRouter key handling, lesson navigation, generated diagrams, layout changes, custom subject setup, curriculum resources, linting, production build, sidebar layout, and progress export/import.

Open `docs/daily-log.md`.

Script:

> This is the daily project log. It tracks the work completed from project planning through final rubric evidence and screen capture preparation.

### 15. Code Walkthrough Closing

Script:

> To summarize the rubric evidence: the app has a complete GUI, object-oriented classes, constructors, inheritance, polymorphism, a 2D array, selection sort, binary search, recursion, file input and output, comments, naming conventions, a UML diagram, a testing log, and a daily log. The product itself is usable because it runs locally, opens a tldraw study canvas, navigates course lessons, and supports a voice tutor that can draw editable study diagrams.

## Submission Checklist

Before uploading:

- Record Video 1: product demo.
- Record Video 2: code and rubric walkthrough.
- Upload both videos or links to `Culminating Project Screen Recording Submissions` in Google Classroom.
- Attach the GitHub repository link if there is a place for it.
- Make sure the reflection/evaluation is submitted.
- Make sure the daily log form is submitted.

## Quick File Reference

| Requirement | File to show |
| --- | --- |
| App demo | `http://localhost:3000` |
| Rubric map | `docs/rubric-evidence.md` |
| UML | `docs/uml-diagram.md` |
| OOP classes | `lib/studyEngine.ts` |
| Constructors | `lib/studyEngine.ts` |
| Inheritance | `lib/studyEngine.ts` |
| Polymorphism | `lib/studyEngine.ts` |
| 2D array | `lib/studyEngine.ts` |
| Sorting | `lib/studyEngine.ts` |
| Searching | `lib/studyEngine.ts` |
| Recursion | `lib/studyEngine.ts` |
| File input/output | `components/LearnSciWorkspace.tsx` |
| GUI/tldraw | `components/LearnSciWorkspace.tsx` |
| AI tool calling | `lib/openrouter.ts` |
| Voice routes | `app/api/tutor/voice/route.ts` |
| Chat route | `app/api/tutor/chat/route.ts` |
| Curriculum/resources | `lib/curriculum.ts` |
| Testing evidence | `docs/testing-log.md` |
| Daily log evidence | `docs/daily-log.md` |
