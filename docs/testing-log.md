# LearnSci Testing Log

| Date | Test | Result |
| --- | --- | --- |
| May 31, 2026 | Verified app starts with `npm run dev` and loads the tldraw workspace. | Pass |
| May 31, 2026 | Tested OpenRouter key loading through local API routes instead of exposing the key to the browser. | Pass |
| June 1, 2026 | Tested lesson selection and unit accordion navigation. | Pass |
| June 2, 2026 | Tested tutor tool calls drawing boxes, arrows, labels, and diagrams on tldraw. | Pass |
| June 3, 2026 | Tested generated diagram spacing and improved label placement to reduce overlap. | Pass |
| June 5, 2026 | Tested custom subject setup with pasted lesson lines and optional URLs. | Pass |
| June 7, 2026 | Tested Classroom-sourced ICS4U lesson resources and YouTube links in the lesson context. | Pass |
| June 8, 2026 | Ran `npm run lint`. | Pass |
| June 8, 2026 | Ran `npm run build`. | Pass |
| June 8, 2026 | Browser-checked embedded sidebar layout: rail at `x=0`, canvas starts after the rail, no console errors. | Pass |
| June 8, 2026 | Tested project evidence export/import controls in the settings modal. | Pass |

## Screen Capture Checklist

1. Open `http://localhost:3000`.
2. Show the embedded lesson rail and tldraw canvas.
3. Click a lesson with resources, such as `2D Arrays Recap`.
4. Click the talk bubble and explain that the tutor can call drawing tools.
5. Open settings, expand `Project evidence`, and export/import the progress JSON.
6. Show `lib/studyEngine.ts` for OOP, 2D array, sort, search, recursion, and comments.
7. Show `docs/uml-diagram.md` for class relationships.

