import type { CurriculumTopic } from "@/lib/curriculum";

export type EvidenceLevel = "Core" | "High" | "Medium";

export type StudyEvidence = {
  topicId: string;
  title: string;
  skills: string[];
  difficulty: number;
  level: EvidenceLevel;
};

export type SearchResult = {
  found: boolean;
  index: number;
  probes: string[];
};

export type ProgressLog = {
  exportedAt: string;
  summary: string;
  evidence: StudyEvidence[];
  sortedTitles: string[];
  searchProbe: SearchResult;
  recursivePath: string[];
  reviewGrid: string[][];
};

/**
 * Base object-oriented class for anything that can appear in the study plan.
 * LessonNode extends this class to show inheritance and polymorphism.
 */
export class StudyNode {
  constructor(
    public readonly id: string,
    public readonly title: string,
  ) {}

  /** Returns the display label for a generic study node. */
  label() {
    return this.title;
  }
}

/**
 * A concrete lesson object. It adds skills, difficulty, and rubric level data
 * while overriding label() from StudyNode.
 */
export class LessonNode extends StudyNode {
  constructor(
    id: string,
    title: string,
    public readonly skills: string[],
    public readonly difficulty: number,
    public readonly level: EvidenceLevel,
  ) {
    super(id, title);
  }

  /** Polymorphic label used when lessons are shown as richer nodes. */
  label() {
    return `${this.title} (${this.skills.slice(0, 2).join(", ")})`;
  }
}

/**
 * StudyDeck converts curriculum data into class objects and exposes the
 * required rubric algorithms: 2D array building, sorting, searching, recursion.
 */
export class StudyDeck {
  private readonly lessons: LessonNode[];

  constructor(topics: CurriculumTopic[]) {
    this.lessons = topics.flatMap((topic) =>
      topic.items.map(
        (item, index) =>
          new LessonNode(
            `${topic.id}-${index}`,
            item.title,
            item.skills,
            item.skills.length + (topic.examWeight === "High" ? 3 : topic.examWeight === "Core" ? 2 : 1),
            topic.examWeight,
          ),
      ),
    );
  }

  allLessons() {
    return [...this.lessons];
  }

  /** Creates plain evidence records suitable for JSON file export. */
  toEvidence() {
    return this.lessons.map((lesson) => ({
      topicId: lesson.id.split("-").slice(0, -1).join("-"),
      title: lesson.title,
      skills: lesson.skills,
      difficulty: lesson.difficulty,
      level: lesson.level,
    }));
  }

  /**
   * Builds a two-dimensional review grid where each row contains up to
   * `columns` lesson titles. This is the project's explicit 2D array evidence.
   */
  build2DReviewGrid(columns = 3) {
    const rows: string[][] = [];
    this.lessons.forEach((lesson, index) => {
      const row = Math.floor(index / columns);
      rows[row] ??= [];
      rows[row].push(lesson.title);
    });
    return rows;
  }

  /**
   * Selection sort by calculated lesson difficulty.
   * This intentionally uses the course-taught algorithm instead of Array.sort().
   */
  selectionSortByDifficulty() {
    const sorted = this.allLessons();

    for (let i = 0; i < sorted.length - 1; i += 1) {
      let minIndex = i;
      for (let j = i + 1; j < sorted.length; j += 1) {
        if (sorted[j].difficulty < sorted[minIndex].difficulty) {
          minIndex = j;
        }
      }

      if (minIndex !== i) {
        [sorted[i], sorted[minIndex]] = [sorted[minIndex], sorted[i]];
      }
    }

    return sorted;
  }

  /**
   * Binary search over alphabetically sorted lesson titles.
   * The probes array records each middle value checked for testing evidence.
   */
  binarySearchByTitle(title: string): SearchResult {
    const sorted = this.allLessons().sort((a, b) => a.title.localeCompare(b.title));
    let low = 0;
    let high = sorted.length - 1;
    const probes: string[] = [];

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const current = sorted[mid];
      probes.push(current.title);
      const comparison = current.title.localeCompare(title);

      if (comparison === 0) {
        return { found: true, index: mid, probes };
      }

      if (comparison < 0) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return { found: false, index: -1, probes };
  }

  /**
   * Recursively builds the prerequisite path up to a target topic.
   * The nested helper is the explicit recursion evidence for the rubric.
   */
  recursivePrerequisitePath(topicId: string) {
    const path = ["Java Foundations", "Object Oriented Programming", "Sorting, Searching, and Mazes", "Recursion"];

    function buildPath(index: number): string[] {
      if (index <= 0) return [path[0]];
      return [...buildPath(index - 1), path[index]];
    }

    const targetIndex = Math.max(
      0,
      path.findIndex((item) => item.toLowerCase().includes(topicId.split("-")[0])),
    );
    return buildPath(targetIndex === -1 ? path.length - 1 : targetIndex);
  }
}

/** Builds a complete JSON-safe project log for browser file output. */
export function createProgressLog(topics: CurriculumTopic[], summary: string): ProgressLog {
  const deck = new StudyDeck(topics);
  const sorted = deck.selectionSortByDifficulty();

  return {
    exportedAt: new Date().toISOString(),
    summary,
    evidence: deck.toEvidence(),
    sortedTitles: sorted.map((lesson) => lesson.title),
    searchProbe: deck.binarySearchByTitle("Recursion Intro"),
    recursivePath: deck.recursivePrerequisitePath("recursion"),
    reviewGrid: deck.build2DReviewGrid(),
  };
}

/** Turns a progress log into short human-readable evidence lines. */
export function summarizeEvidence(log: ProgressLog) {
  return [
    `${log.evidence.length} lesson objects`,
    `${log.reviewGrid.length} rows in a 2D review grid`,
    `${log.sortedTitles.length} lessons sorted by difficulty`,
    `${log.searchProbe.probes.length} binary-search probes`,
    `${log.recursivePath.length} recursive prerequisite steps`,
  ];
}

/** Produces rubric evidence lines without creating a dated export file. */
export function createEvidenceSummary(topics: CurriculumTopic[]) {
  const deck = new StudyDeck(topics);
  const sorted = deck.selectionSortByDifficulty();
  const searchProbe = deck.binarySearchByTitle("Recursion Intro");
  const recursivePath = deck.recursivePrerequisitePath("recursion");
  const reviewGrid = deck.build2DReviewGrid();

  return [
    `${deck.toEvidence().length} lesson objects`,
    `${reviewGrid.length} rows in a 2D review grid`,
    `${sorted.length} lessons sorted by difficulty`,
    `${searchProbe.probes.length} binary-search probes`,
    `${recursivePath.length} recursive prerequisite steps`,
  ];
}
