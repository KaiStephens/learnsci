# LearnSci UML Diagram

```mermaid
classDiagram
  class LearnSciWorkspace {
    -studyProfile: StudyProfile
    -selectedTopicId: string
    -selectedLessonIndex: number
    -sessionState: SessionState
    +applyStudySetup()
    +exportProgressLog()
    +importProgressLog(file)
    +startRecording()
    +sendPrompt(message)
  }

  class CurriculumTopic {
    +id: string
    +name: string
    +objective: string
    +items: CurriculumItem[]
  }

  class CurriculumItem {
    +title: string
    +skills: string[]
    +reviewPrompt: string
    +resources: CurriculumResource[]
  }

  class StudyNode {
    +id: string
    +title: string
    +label()
  }

  class LessonNode {
    +skills: string[]
    +difficulty: number
    +level: EvidenceLevel
    +label()
  }

  class StudyDeck {
    -lessons: LessonNode[]
    +allLessons()
    +toEvidence()
    +build2DReviewGrid(columns)
    +selectionSortByDifficulty()
    +binarySearchByTitle(title)
    +recursivePrerequisitePath(topicId)
  }

  class ProgressLog {
    +exportedAt: string
    +summary: string
    +evidence: StudyEvidence[]
    +sortedTitles: string[]
    +recursivePath: string[]
    +reviewGrid: string[][]
  }

  class TutorApiRoutes {
    +POST chat(request)
    +POST voice(request)
  }

  class OpenRouterTutor {
    +runTutorTurn(input)
    +transcribeAudio(input)
    +synthesizeSpeech(text)
  }

  LearnSciWorkspace --> CurriculumTopic : displays
  CurriculumTopic *-- CurriculumItem : contains
  StudyNode <|-- LessonNode : extends
  StudyDeck *-- LessonNode : manages
  StudyDeck --> ProgressLog : creates
  LearnSciWorkspace --> StudyDeck : evidence summary/export
  LearnSciWorkspace --> TutorApiRoutes : chat/voice requests
  TutorApiRoutes --> OpenRouterTutor : delegates
```

## Relationship Summary

- `LessonNode` inherits from `StudyNode` and overrides `label()`.
- `StudyDeck` composes many `LessonNode` objects and runs the rubric algorithms.
- `LearnSciWorkspace` connects the GUI, tldraw canvas, voice input, file input/output, and AI tutor routes.

