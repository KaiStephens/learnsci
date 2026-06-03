export type CurriculumItemType = "material" | "checkpoint";

export type CurriculumItem = {
  title: string;
  type: CurriculumItemType;
  date: string;
  status?: "reference";
  skills: string[];
  reviewPrompt: string;
};

export type CurriculumTopic = {
  id: string;
  name: string;
  accent: string;
  objective: string;
  examWeight: "Core" | "High" | "Medium";
  items: CurriculumItem[];
  checkpoints: string[];
};

export const classroomScan = {
  course: "1-12 Computer Science ICS4U1",
  source: "Firefox Google Classroom classwork and stream scan",
  scannedAt: "2026-05-31",
  privacy:
    "This app stores a sanitized lesson outline inferred from titles and topics. It does not commit private attachments, student submissions, or teacher-authored instructions.",
};

export const curriculum: CurriculumTopic[] = [
  {
    id: "graphics-gui",
    name: "Graphics, GUI, Vibecoding",
    accent: "#8fd8ff",
    objective:
      "Review Java graphics, simple UI thinking, game loops, and event-driven project structure.",
    examWeight: "Medium",
    checkpoints: [
      "Separate model state from drawing code.",
      "Describe the draw loop, input handling, and collision/update order.",
      "Use small classes for screens, sprites, tickets, or UI entities.",
      "Debug visual code by logging state before changing rendering.",
    ],
    items: [
      {
        title: "Java Graphics",
        type: "material",
        date: "Apr 27",
        status: "reference",
        skills: ["drawing APIs", "panels", "repaint"],
        reviewPrompt:
          "Summarize the minimum setup needed to draw and refresh a Java graphics view.",
      },
    ],
  },
  {
    id: "oop",
    name: "Object Oriented Programming",
    accent: "#c8b6ff",
    objective:
      "Master classes, constructors, encapsulation, inheritance, polymorphism, interfaces, UML, and Comparable.",
    examWeight: "High",
    checkpoints: [
      "Define fields, constructors, methods, and object identity.",
      "Explain encapsulation with private fields and public methods.",
      "Contrast inheritance, interfaces, overriding, and overloading.",
      "Draw a UML diagram from a written class relationship.",
      "Use Comparable to sort objects by a meaningful attribute.",
    ],
    items: [
      {
        title: "Practice Test 2",
        type: "checkpoint",
        date: "Apr 22",
        status: "reference",
        skills: ["OOP review", "exam timing"],
        reviewPrompt:
          "Run an oral practice test focused on class design, UML, and polymorphism.",
      },
      {
        title: "Quiz 2 Review",
        type: "material",
        date: "Apr 17",
        status: "reference",
        skills: ["quiz review", "definitions", "code reading"],
        reviewPrompt: "Ask mixed short-answer questions across the OOP unit.",
      },
      {
        title: "OOP; Abstraction and Recap 5/5",
        type: "material",
        date: "Apr 16",
        status: "reference",
        skills: ["abstraction", "interfaces", "review"],
        reviewPrompt:
          "Explain abstraction as hiding detail behind a useful public contract.",
      },
      {
        title: "OOP; Polymorphism and Interfaces 4/5",
        type: "material",
        date: "Apr 16",
        status: "reference",
        skills: ["polymorphism", "interfaces", "dynamic dispatch"],
        reviewPrompt:
          "Use a parent/interface reference pointing at child objects and predict method calls.",
      },
      {
        title: "OOP UML Diagrams",
        type: "material",
        date: "Apr 15",
        status: "reference",
        skills: ["UML notation", "design"],
        reviewPrompt:
          "Map a code snippet into UML notation and explain each relationship.",
      },
      {
        title: "OOP Encapsulation",
        type: "material",
        date: "Apr 14",
        status: "reference",
        skills: ["private data", "getters", "setters", "invariants"],
        reviewPrompt: "Explain why direct field access can break object invariants.",
      },
      {
        title: "OOP; Program Structure and Constructors 2/5",
        type: "material",
        date: "Apr 2",
        status: "reference",
        skills: ["constructors", "program structure"],
        reviewPrompt:
          "Design constructors that initialize valid objects without duplicated setup.",
      },
      {
        title: "OOP; Objects and Classes 1/5",
        type: "material",
        date: "Mar 31",
        status: "reference",
        skills: ["objects", "classes", "fields", "methods"],
        reviewPrompt:
          "Explain the difference between a class blueprint and an object instance.",
      },
    ],
  },
  {
    id: "algorithms",
    name: "Sorting, Searching, and Mazes",
    accent: "#ffd89b",
    objective:
      "Review algorithmic thinking through sorting, searching, 2D arrays, maze solving, and Tremaux-style traversal.",
    examWeight: "Core",
    checkpoints: [
      "Compare linear and binary search assumptions and time costs.",
      "Trace a sort pass by pass without skipping index changes.",
      "Represent grid problems with rows, columns, bounds, and visited state.",
      "Explain recursion or stack behavior in maze traversal.",
    ],
    items: [
      {
        title: "Practice Test",
        type: "checkpoint",
        date: "Mar 13",
        status: "reference",
        skills: ["sorting", "searching", "2D arrays"],
        reviewPrompt:
          "Run timed questions on trace tables, binary search, and nested loops.",
      },
      {
        title: "Sorting Quiz Prep",
        type: "material",
        date: "Mar 4",
        status: "reference",
        skills: ["bubble sort", "selection sort", "insertion sort"],
        reviewPrompt:
          "Compare common sorts by what they do on each pass and how many swaps occur.",
      },
      {
        title: "Tremaux Algorithm",
        type: "material",
        date: "Apr 1",
        status: "reference",
        skills: ["maze traversal", "marking paths"],
        reviewPrompt:
          "Summarize Tremaux traversal as marks, choices, dead ends, and backtracking.",
      },
    ],
  },
  {
    id: "recursion",
    name: "Recursion",
    accent: "#ffb4d6",
    objective:
      "Understand recursive structure, base cases, stack behavior, and how recursion supports search and grid problems.",
    examWeight: "Core",
    checkpoints: [
      "Identify the base case before the recursive case.",
      "Track parameters across each recursive call.",
      "Predict the return order using a call stack sketch.",
      "Know when iteration is simpler than recursion.",
    ],
    items: [
      {
        title: "Recursion Multiple Choice Questions",
        type: "material",
        date: "Feb 24",
        status: "reference",
        skills: ["MCQ review", "trace calls"],
        reviewPrompt:
          "Ask multiple-choice recursion trace questions and explain wrong answers.",
      },
      {
        title: "Recursion Intro",
        type: "material",
        date: "Feb 19",
        status: "reference",
        skills: ["definition", "call stack", "self-similar problems"],
        reviewPrompt:
          "Explain recursion using the smallest possible example, then draw the stack.",
      },
    ],
  },
  {
    id: "java-foundations",
    name: "Java Foundations",
    accent: "#f6f0a8",
    objective:
      "Refresh Java syntax, loops, input, arrays, 2D arrays, enhanced for loops, comments, and Eclipse workflow.",
    examWeight: "Core",
    checkpoints: [
      "Write clean loops with correct bounds.",
      "Use arrays and ArrayLists for the right job.",
      "Trace nested loops over 2D arrays.",
      "Explain comments, naming, and small-method structure.",
    ],
    items: [
      {
        title: "Quiz on Arrays Review",
        type: "material",
        date: "Feb 17",
        status: "reference",
        skills: ["arrays", "quiz prep"],
        reviewPrompt:
          "Ask quick questions on array indexing, length, and common off-by-one errors.",
      },
      {
        title: "2D Arrays Recap",
        type: "material",
        date: "Feb 11",
        status: "reference",
        skills: ["2D arrays", "review"],
        reviewPrompt:
          "Summarize 2D arrays as arrays of rows and practice safe bounds checks.",
      },
      {
        title: "Coding techniques and Eclipse Shortcuts",
        type: "material",
        date: "Feb 4",
        status: "reference",
        skills: ["IDE workflow", "comments", "formatting"],
        reviewPrompt:
          "List workflow habits that make Java code easier to debug and submit.",
      },
      {
        title: "ArrayList VS Array in Java",
        type: "material",
        date: "Mar 13",
        status: "reference",
        skills: ["arrays", "ArrayList", "tradeoffs"],
        reviewPrompt:
          "Choose between arrays and ArrayLists for a scenario and justify the choice.",
      },
    ],
  },
];

export function getTopic(topicId: string) {
  return curriculum.find((topic) => topic.id === topicId) ?? curriculum[0];
}

export function flattenCurriculum() {
  return curriculum.flatMap((topic) =>
    topic.items.map((item) => ({
      topic: topic.name,
      topicId: topic.id,
      ...item,
    })),
  );
}

export function buildCurriculumPrompt(topicId?: string) {
  const activeTopic = topicId ? getTopic(topicId) : undefined;
  const topicLines = curriculum
    .map((topic) => {
      const itemTitles = topic.items.map((item) => item.title).join("; ");
      return `- ${topic.name}: ${topic.objective} Lessons: ${itemTitles}.`;
    })
    .join("\n");

  const activeLines = activeTopic
    ? `\nActive focus: ${activeTopic.name}. Objective: ${activeTopic.objective}. Checkpoints: ${activeTopic.checkpoints.join(" ")}`
    : "";

  return `${classroomScan.course} sanitized lesson outline from ${classroomScan.source} on ${classroomScan.scannedAt}.
Privacy note: ${classroomScan.privacy}

Curriculum:
${topicLines}
${activeLines}`;
}
