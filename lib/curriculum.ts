export type CurriculumItemType = "assignment" | "material" | "checkpoint";

export type CurriculumItem = {
  title: string;
  type: CurriculumItemType;
  date: string;
  due?: string;
  status?: "completed" | "upcoming" | "reference";
  skills: string[];
  reviewPrompt: string;
};

export type CurriculumTopic = {
  id: string;
  name: string;
  accent: string;
  objective: string;
  examWeight: "Core" | "High" | "Medium" | "Project";
  items: CurriculumItem[];
  checkpoints: string[];
};

export const classroomScan = {
  course: "1-12 Computer Science ICS4U1",
  source: "Firefox Google Classroom classwork and stream scan",
  scannedAt: "2026-05-31",
  privacy:
    "This app stores a sanitized outline inferred from titles, topics, and due dates. It does not commit private attachments, student submissions, or teacher-authored instructions.",
};

export const curriculum: CurriculumTopic[] = [
  {
    id: "culminating",
    name: "Culminating Project",
    accent: "#9be7c0",
    objective:
      "Turn the final project into a clean product demo with a clear plan, conference readiness, and evidence of iteration.",
    examWeight: "Project",
    checkpoints: [
      "Explain the problem, user, and success criteria in one minute.",
      "Show a working feature before explaining the code.",
      "Connect commits to specific product improvements.",
      "Prepare answers for architecture, testing, and next steps.",
    ],
    items: [
      {
        title: "Culminating Project Marking and Conference Prep",
        type: "assignment",
        date: "May 21",
        due: "Jun 8",
        status: "upcoming",
        skills: ["demo planning", "rubric mapping", "conference answers"],
        reviewPrompt:
          "Build a final defense: what changed, why it matters, and how the code proves it.",
      },
      {
        title: "Culminating Project Plan",
        type: "assignment",
        date: "May 20",
        due: "May 22",
        status: "completed",
        skills: ["scope", "milestones", "risk control"],
        reviewPrompt:
          "Convert the original plan into a concise roadmap with completed and remaining work.",
      },
      {
        title: "Conferences List",
        type: "material",
        date: "May 20",
        status: "reference",
        skills: ["presentation timing", "feedback loop"],
        reviewPrompt:
          "Prepare short answers for what you built, what challenged you, and what you would improve.",
      },
    ],
  },
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
        title: "Java IT Ticket System",
        type: "assignment",
        date: "May 11",
        due: "May 19",
        status: "completed",
        skills: ["classes", "state", "workflow modeling", "UI data"],
        reviewPrompt:
          "Explain how tickets move through states and where objects store responsibility.",
      },
      {
        title: "Game Lab",
        type: "assignment",
        date: "Apr 30",
        due: "May 7",
        status: "completed",
        skills: ["game loop", "sprites", "input", "collision"],
        reviewPrompt:
          "Sketch a game loop and label update, render, input, and collision checks.",
      },
      {
        title: "Pre Game Task",
        type: "assignment",
        date: "Apr 28",
        due: "Apr 30",
        status: "completed",
        skills: ["planning", "pseudocode", "asset breakdown"],
        reviewPrompt:
          "Turn a game idea into classes, fields, methods, and testable states.",
      },
      {
        title: "Graphics Practice",
        type: "assignment",
        date: "Apr 27",
        due: "Apr 28",
        status: "completed",
        skills: ["coordinates", "painting", "layout"],
        reviewPrompt:
          "Practice coordinate reasoning and explain how a shape's position is calculated.",
      },
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
        reviewPrompt:
          "Ask mixed short-answer questions across the OOP unit.",
      },
      {
        title: "OOP Unit Task; Arrays with Comparable",
        type: "assignment",
        date: "Apr 17",
        due: "Apr 24",
        status: "completed",
        skills: ["Comparable", "arrays", "object sorting"],
        reviewPrompt:
          "Explain how compareTo works and why object arrays need a comparison rule.",
      },
      {
        title: "OOP; Pre-summative task",
        type: "assignment",
        date: "Apr 16",
        status: "completed",
        skills: ["class design", "unit review"],
        reviewPrompt:
          "Identify the fields and methods from a short scenario, then draw the class.",
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
        title: "UML Diagrams Practice",
        type: "assignment",
        date: "Apr 15",
        due: "Apr 17",
        status: "completed",
        skills: ["UML", "relationships", "class diagrams"],
        reviewPrompt:
          "Draw a UML diagram with attributes, methods, inheritance, and associations.",
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
        reviewPrompt:
          "Explain why direct field access can break object invariants.",
      },
      {
        title: "OOP; Inheritance 3/5",
        type: "assignment",
        date: "Apr 10",
        status: "completed",
        skills: ["extends", "super", "overriding"],
        reviewPrompt:
          "Trace constructor calls and overridden methods across parent and child classes.",
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
      {
        title: "Intro to OOP",
        type: "assignment",
        date: "Mar 26",
        status: "completed",
        skills: ["OOP basics", "Becker robots"],
        reviewPrompt:
          "Connect robot/object examples to fields, methods, and object state.",
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
        title: "2D String Array Sorting and Searching (Unit Task)",
        type: "assignment",
        date: "Mar 9",
        due: "Mar 12",
        status: "completed",
        skills: ["2D arrays", "string sorting", "searching"],
        reviewPrompt:
          "Trace a nested loop over rows and columns, then sort records by a selected field.",
      },
      {
        title: "Linear and Binary Search",
        type: "assignment",
        date: "Mar 5",
        due: "Mar 9",
        status: "completed",
        skills: ["linear search", "binary search", "preconditions"],
        reviewPrompt:
          "Explain when binary search fails and why sorted input matters.",
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
        title: "Sorting Summative",
        type: "assignment",
        date: "Mar 2",
        due: "Mar 4",
        status: "completed",
        skills: ["sorting implementation", "testing"],
        reviewPrompt:
          "Write pseudocode for a sort and list edge cases: empty, one item, duplicates.",
      },
      {
        title: "Collaborative Sorting Research",
        type: "assignment",
        date: "Feb 24",
        due: "Feb 27",
        status: "completed",
        skills: ["algorithm research", "comparison"],
        reviewPrompt:
          "Teach one sorting algorithm with an example list and a plain-language tradeoff.",
      },
      {
        title: "Maze Solver",
        type: "assignment",
        date: "Mar 27",
        status: "completed",
        skills: ["pathfinding", "visited state", "recursion"],
        reviewPrompt:
          "Draw a maze search and identify base cases, branches, and backtracking.",
      },
      {
        title: "Random Maze Generator + Solver",
        type: "assignment",
        date: "Mar 30",
        status: "completed",
        skills: ["generation", "solver design", "2D grids"],
        reviewPrompt:
          "Explain how a generated maze stays solvable and how the solver records progress.",
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
      {
        title: "Clear Mines",
        type: "assignment",
        date: "Apr 7",
        status: "completed",
        skills: ["grid state", "neighbor checks", "conditionals"],
        reviewPrompt:
          "Trace how a grid-based game checks neighbors and updates visible cells.",
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
        title: "Recursion Practice Exercises",
        type: "assignment",
        date: "Feb 23",
        due: "Feb 26",
        status: "completed",
        skills: ["base case", "recursive case", "return values"],
        reviewPrompt:
          "Trace a recursive method line by line until the base case returns.",
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
        title: "2D Array Summative Task",
        type: "assignment",
        date: "Feb 12",
        due: "Feb 17",
        status: "completed",
        skills: ["2D arrays", "nested loops", "grid data"],
        reviewPrompt:
          "Trace row-major traversal and explain how row/column indices map to data.",
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
        title: "1D Arrays Summative Task",
        type: "assignment",
        date: "Feb 6",
        due: "Feb 9",
        status: "completed",
        skills: ["1D arrays", "loops", "aggregation"],
        reviewPrompt:
          "Write a loop that finds min, max, sum, and average without index mistakes.",
      },
      {
        title: "Arrays Review, Loops, for:each loops",
        type: "assignment",
        date: "Feb 5",
        due: "Feb 5",
        status: "completed",
        skills: ["loops", "enhanced for", "array traversal"],
        reviewPrompt:
          "Compare indexed loops and enhanced for loops, including when each is useful.",
      },
      {
        title: "Loops and Input Recap",
        type: "assignment",
        date: "Feb 3",
        due: "Feb 4",
        status: "completed",
        skills: ["input", "while loops", "for loops"],
        reviewPrompt:
          "Review loop control flow and how user input changes program state.",
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
        title: "ArrayList Practice",
        type: "assignment",
        date: "Mar 13",
        status: "completed",
        skills: ["ArrayList", "dynamic collections", "methods"],
        reviewPrompt:
          "Explain ArrayList add, remove, get, size, and how indices shift after removal.",
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
      return `- ${topic.name}: ${topic.objective} Items: ${itemTitles}.`;
    })
    .join("\n");

  const activeLines = activeTopic
    ? `\nActive focus: ${activeTopic.name}. Objective: ${activeTopic.objective}. Checkpoints: ${activeTopic.checkpoints.join(" ")}`
    : "";

  return `${classroomScan.course} sanitized curriculum outline from ${classroomScan.source} on ${classroomScan.scannedAt}.
Privacy note: ${classroomScan.privacy}

Curriculum:
${topicLines}
${activeLines}`;
}
