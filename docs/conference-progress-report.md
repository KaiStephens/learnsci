# LearnSci Conference Progress Report

Name: Kai Stephens

Course: ICS4U

Date: June 7, 2026

## Summary

LearnSci is an AI-powered visual study workspace for Grade 12 Computer Science review. The application uses a tldraw canvas as the main workspace, an embedded lesson sidebar for ICS4U review topics, and a voice-capable AI tutor that can explain concepts and draw editable diagrams directly on the board.

The purpose of the project is to make exam review more interactive. Instead of only reading notes, a learner can choose a topic, talk to the tutor, and receive visual explanations for concepts such as object-oriented programming, 2D arrays, sorting/searching, recursion, Java graphics, and UML.

## UML Summary

```text
LearnSciWorkspace
  -> uses CurriculumTopic and CurriculumItem
  -> sends chat/voice requests to Tutor API routes
  -> applies TutorToolCall results
  -> draws CanvasDrawing objects into tldraw

StudyDeck extends the curriculum into rubric evidence:
  StudyNode
    ^-- LessonNode
  StudyDeck
    - builds a 2D lesson grid
    - runs selection sort
    - runs binary search
    - builds a recursive prerequisite path
    - exports/imports progress log JSON through the settings modal
```

## Tasks Completed

1. Built the Next.js, React, TypeScript, and tldraw app.
2. Created a minimal embedded sidebar with course units and lessons.
3. Added OpenRouter-backed tutor routes for chat and voice.
4. Added speech-to-text and text-to-speech pipeline support.
5. Added `draw_canvas` tool calling so the tutor can draw editable diagrams.
6. Improved the drawing renderer to reduce overlapping boxes, labels, and arrows.
7. Removed assignment-only content and kept the app focused on lessons.
8. Added a rubric evidence engine with OOP classes, data structures, sorting, searching, recursion, and progress-log file input/output.
9. Moved project evidence into the settings modal to keep the main study screen clean.
10. Added progress log export/import for file input/output evidence.

## Current Tasks

1. Test final tutor prompts with the course topics.
2. Use the settings modal project evidence section during the conference.
3. Export the progress log JSON as file I/O evidence.
4. Record the screen capture demonstration.

## Remaining Tasks

1. Prepare final personal reflection.
2. Prepare peer evaluation.
3. Confirm all daily/project logs are submitted.
4. Record the final walkthrough and explain the code evidence.

## Rubric Evidence

- Object-oriented programming: `StudyNode`, `LessonNode`, and `StudyDeck` in `lib/studyEngine.ts`.
- Inheritance/polymorphism: `LessonNode` extends `StudyNode` and overrides `label()`.
- 2D arrays/data structures: `StudyDeck.build2DReviewGrid()` creates a two-dimensional lesson grid.
- Sorting: `StudyDeck.selectionSortByDifficulty()` implements selection sort.
- Searching: `StudyDeck.binarySearchByTitle()` implements binary search.
- Recursion: `StudyDeck.recursivePrerequisitePath()` uses a recursive helper.
- File input/output: the app exports and imports progress logs as JSON.
- GUI/graphics: the app uses tldraw for an editable visual canvas.
- Input/output: voice input, lesson selection, file import, JSON export, and AI audio responses.

## References

- Next.js documentation
- React documentation
- TypeScript documentation
- tldraw documentation
- OpenRouter API documentation
- ICS4U course topics and review outline

## Reflection

The strongest part of the project is the combination of a minimal drawing workspace with an AI tutor that can create diagrams. The hardest part was making generated diagrams readable because model-created coordinates can overlap. I improved this by changing the tool design and adding renderer-side collision handling. The project now has clearer evidence for the programming rubric and is ready to demonstrate as a working application.
