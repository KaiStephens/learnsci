export type CurriculumItemType = "material" | "checkpoint";

export type CurriculumResource = {
  title: string;
  url: string;
  kind: "video" | "website" | "document" | "reference";
};

export type CurriculumItem = {
  title: string;
  type: CurriculumItemType;
  date: string;
  status?: "reference";
  skills: string[];
  reviewPrompt: string;
  resources?: CurriculumResource[];
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
  source: "Google Classroom classwork bulk response scan",
  scannedAt: "2026-06-08",
  privacy:
    "This app stores a sanitized lesson outline with public YouTube and website resources. It does not commit private Drive attachments, student submissions, forms, or teacher-only instructions.",
};

const video = (title: string, url: string): CurriculumResource => ({
  title,
  url,
  kind: "video",
});

const website = (title: string, url: string): CurriculumResource => ({
  title,
  url,
  kind: "website",
});

const reference = (title: string, url: string): CurriculumResource => ({
  title,
  url,
  kind: "reference",
});

export const curriculum: CurriculumTopic[] = [
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
        title: "Review Resources",
        type: "material",
        date: "Jan 27",
        status: "reference",
        skills: ["course review", "Java reference", "practice"],
        reviewPrompt:
          "Build a short Java review plan from the course reference resources.",
        resources: [
          reference("Coding with John", "https://www.youtube.com/@CodingWithJohn"),
          video(
            "Java tutorial playlist",
            "https://www.youtube.com/playlist?list=PLZPZq0r_RZOOj_NOZYq_R2PECIMglLemc",
          ),
          video(
            "Java lessons playlist",
            "https://www.youtube.com/playlist?list=PLNb_-KeTZieW3DNI2aLOAYBnjx29CN8dT",
          ),
          reference("Runestone CSAwesome", "https://runestone.academy/ns/books/published/csawesome/index.html"),
        ],
      },
      {
        title: "Loops and Input Recap",
        type: "material",
        date: "Feb 4",
        status: "reference",
        skills: ["loops", "input", "trace tables"],
        reviewPrompt:
          "Review scanner input, loop setup, loop updates, and common off-by-one mistakes.",
      },
      {
        title: "Coding Techniques and Eclipse Shortcuts",
        type: "material",
        date: "Feb 4",
        status: "reference",
        skills: ["IDE workflow", "comments", "formatting"],
        reviewPrompt:
          "List workflow habits that make Java code easier to debug and submit.",
        resources: [
          video(
            "Top 5 Terrible Java Coding Techniques You Need to Be Using Right Now",
            "https://www.youtube.com/watch?v=YpS0Jh5yqIw",
          ),
          video(
            "30+ Eclipse Shortcuts Every Java Programmer Should Know",
            "https://www.youtube.com/watch?v=LIGkIGdmHII",
          ),
        ],
      },
      {
        title: "Arrays Review and For-Each Loops",
        type: "material",
        date: "Feb 5",
        status: "reference",
        skills: ["arrays", "enhanced for loop", "indexing"],
        reviewPrompt:
          "Teach array traversal with indexed loops and enhanced for loops, then quiz indexing.",
        resources: [video("Java for-each loop", "https://www.youtube.com/watch?v=_IT8F5W0ZO4")],
      },
      {
        title: "Quiz on Arrays Review",
        type: "material",
        date: "Feb 17",
        status: "reference",
        skills: ["arrays", "quiz prep", "objects in arrays"],
        reviewPrompt:
          "Ask quick questions on array indexing, length, parameters, and arrays of objects.",
        resources: [
          reference("Runestone Array Basics", "https://runestone.academy/ns/books/published/apcsareview/ArrayBasics/toctree.html"),
          website("Chortle quiz on arrays", "https://chortle.ccsu.edu/javaLessons/chap60/chap60quiz.html"),
          website("Chortle quiz on loops and arrays", "https://chortle.ccsu.edu/javaLessons/chap61/chap61quiz.html"),
          website("Chortle quiz on array parameters", "https://chortle.ccsu.edu/javaLessons/chap64/chap64quiz.html"),
          website("Chortle quiz on arrays of objects", "https://chortle.ccsu.edu/javaLessons/chap65/chap65quiz.html"),
        ],
      },
      {
        title: "2D Arrays Recap",
        type: "material",
        date: "Feb 11",
        status: "reference",
        skills: ["2D arrays", "nested loops", "row column indexing"],
        reviewPrompt:
          "Summarize 2D arrays as rows and columns, then draw a bounds-safe traversal.",
        resources: [
          video(
            "Iterate through 2D structure with a for loop",
            "https://www.youtube.com/watch?v=Yr4V3Tdw6CQ",
          ),
          video("Two-Dimensional Arrays in Java Exercise 1", "https://www.youtube.com/watch?v=778UYhztFAE"),
          video("Two-Dimensional Arrays in Java Exercise 2", "https://www.youtube.com/watch?v=8uxGSiCiqZA"),
        ],
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
        title: "ArrayList vs Array in Java",
        type: "material",
        date: "Mar 13",
        status: "reference",
        skills: ["arrays", "ArrayList", "tradeoffs"],
        reviewPrompt:
          "Choose between arrays and ArrayLists for a scenario and justify the choice.",
      },
      {
        title: "Objects and Classes 1/5",
        type: "material",
        date: "Apr 1",
        status: "reference",
        skills: ["objects", "classes", "fields", "methods"],
        reviewPrompt:
          "Explain the difference between a class blueprint and an object instance.",
        resources: [
          website("Chortle quiz on object data", "https://chortle.ccsu.edu/javaLessons/chap11/chap11quiz.html"),
          website("Chortle quiz on objects", "https://chortle.ccsu.edu/javaLessons/chap40/chap40quiz.html"),
          website("Chortle quiz on object references", "https://chortle.ccsu.edu/javaLessons/chap41/chap41quiz.html"),
          website("Chortle quiz on object parameters", "https://chortle.ccsu.edu/javaLessons/chap52/chap52quiz.html"),
          reference("Runestone class exercises", "https://runestone.academy/ns/books/published/csawesome2/Exercises-classes.html"),
        ],
      },
      {
        title: "Program Structure and Constructors 2/5",
        type: "material",
        date: "Apr 2",
        status: "reference",
        skills: ["constructors", "program structure", "valid objects"],
        reviewPrompt:
          "Design constructors that initialize valid objects without duplicated setup.",
      },
      {
        title: "Inheritance 3/5",
        type: "material",
        date: "Apr 10",
        status: "reference",
        skills: ["inheritance", "extends", "overriding"],
        reviewPrompt:
          "Explain inheritance with a parent class, child class, overridden method, and test call.",
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
        title: "Polymorphism and Interfaces 4/5",
        type: "material",
        date: "Apr 16",
        status: "reference",
        skills: ["polymorphism", "interfaces", "dynamic dispatch"],
        reviewPrompt:
          "Use a parent or interface reference pointing at child objects and predict method calls.",
        resources: [
          video("Java OOP Basics 4/5: Interfaces", "https://www.youtube.com/watch?v=KAKtFcvSKp0"),
          reference(
            "Runestone polymorphism",
            "https://runestone.academy/ns/books/published/csawesome/Unit9-Inheritance/topic-9-6-polymorphism.html",
          ),
        ],
      },
      {
        title: "Abstraction and Recap 5/5",
        type: "material",
        date: "Apr 16",
        status: "reference",
        skills: ["abstraction", "abstract classes", "interfaces"],
        reviewPrompt:
          "Explain abstraction as hiding detail behind a useful public contract.",
        resources: [video("Java OOP Basics 5/5: Abstract Classes", "https://www.youtube.com/watch?v=uOd1RrmNZYk")],
      },
      {
        title: "Encapsulation",
        type: "material",
        date: "Apr 14",
        status: "reference",
        skills: ["private data", "getters", "setters", "invariants"],
        reviewPrompt: "Explain why direct field access can break object invariants.",
        resources: [
          video("Java encapsulation", "https://www.youtube.com/watch?v=eboNNUADeIc"),
          website("W3Schools Java encapsulation", "https://www.w3schools.com/java/java_encapsulation.asp"),
          website(
            "Encapsulation approaches in Java",
            "https://medium.com/@himanshu.sharma.for.work/various-approaches-to-encapsulation-in-java-792a6dfad91b",
          ),
        ],
      },
      {
        title: "UML Diagrams",
        type: "material",
        date: "Apr 15",
        status: "reference",
        skills: ["UML notation", "design"],
        reviewPrompt:
          "Map a code snippet into UML notation and explain each relationship.",
        resources: [
          video("UML class diagrams", "https://www.youtube.com/watch?v=6XrL5jXmTwM"),
          video("UML class diagram tutorial in EdrawMax", "https://www.youtube.com/watch?v=ao1ESgIy2Ws"),
          website("draw.io diagrams", "https://app.diagrams.net/"),
          website(
            "UML class diagrams tutorial",
            "https://medium.com/@smagid_allThings/uml-class-diagrams-tutorial-step-by-step-520fd83b300b",
          ),
          website(
            "UML practice problems",
            "https://www.hackerearth.com/problem/algorithm/uml_class-diagram-1/",
          ),
        ],
      },
      {
        title: "Comparable and Object Sorting",
        type: "material",
        date: "Apr 24",
        status: "reference",
        skills: ["Comparable", "compareTo", "object sorting"],
        reviewPrompt:
          "Teach Comparable by sorting an array or list of objects using one field.",
        resources: [
          reference(
            "Programmed Lessons Comparable Interface",
            "https://www.programmedlessons.org/Java9/chap84/ch84_01.html",
          ),
          video("Java Comparable interface", "https://www.youtube.com/watch?v=swEvHhN9l8k"),
          video("Sort an object array or object list", "https://www.youtube.com/watch?v=fe0HtMsqKAs"),
        ],
      },
      {
        title: "Practice Test 2",
        type: "checkpoint",
        date: "Apr 22",
        status: "reference",
        skills: ["OOP review", "exam timing"],
        reviewPrompt:
          "Run an oral practice test focused on class design, UML, and polymorphism.",
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
        title: "Data Structures and Algorithms Visualizations",
        type: "material",
        date: "Feb 26",
        status: "reference",
        skills: ["visualization", "algorithm tracing", "data structures"],
        reviewPrompt:
          "Use visual examples to compare data structure operations and algorithm steps.",
        resources: [
          website("CS 1332 visualizations", "https://csvistool.com/"),
        ],
      },
      {
        title: "Collaborative Sorting Research",
        type: "material",
        date: "Feb 27",
        status: "reference",
        skills: ["bubble sort", "Big O", "algorithm comparison"],
        reviewPrompt:
          "Compare sorting algorithms by trace behavior, time cost, and when each is useful.",
        resources: [
          video("Bubble Sort Java Tutorial", "https://www.youtube.com/watch?v=SwC0UNo_9mA"),
          video("Big O notation in 6 minutes", "https://www.youtube.com/watch?v=XMUe3zFhM5c"),
        ],
      },
      {
        title: "Sorting Quiz Prep",
        type: "material",
        date: "Mar 5",
        status: "reference",
        skills: ["bubble sort", "selection sort", "insertion sort"],
        reviewPrompt:
          "Compare common sorts by what they do on each pass and how many swaps occur.",
        resources: [
          website("Sorting practice quiz", "https://cs30.wmcicompsci.ca/practicequiz/sorting.html"),
          website(
            "Liang sorting self-test",
            "https://liveexample-ppe.pearsoncmg.com/selftest/selftest11e?chapter=23&username=liang11e",
          ),
          website("Sanfoundry sorting MCQ", "https://www.sanfoundry.com/sorting-multiple-choice-questions-mcq/"),
        ],
      },
      {
        title: "Linear and Binary Search",
        type: "material",
        date: "Mar 9",
        status: "reference",
        skills: ["linear search", "binary search", "preconditions"],
        reviewPrompt:
          "Contrast linear search and binary search, including the sorted-data requirement.",
      },
      {
        title: "2D CSV Sorting and Searching",
        type: "material",
        date: "Mar 12",
        status: "reference",
        skills: ["2D string arrays", "CSV", "selection sort", "binary search"],
        reviewPrompt:
          "Explain how a CSV becomes a 2D String structure, then search and sort rows safely.",
        resources: [
          reference("ICS12 teacher examples", "https://github.com/a13xrzteach/ics12"),
          video("Reading a CSV file into a 2D String list", "https://www.youtube.com/watch?v=9ptfooOtjdM"),
        ],
      },
      {
        title: "Maze Traversal and Tremaux",
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
        resources: [
          website("Runestone recursion easy MCQ", "https://runestone.academy/ns/books/published/csawesome/Unit10-Recursion/rEasyMC.html"),
          website("Runestone recursion medium MCQ", "https://runestone.academy/ns/books/published/csawesome/Unit10-Recursion/rMedMC.html"),
          website("Runestone recursion hard MCQ", "https://runestone.academy/ns/books/published/csawesome/Unit10-Recursion/rHardMC.html"),
        ],
      },
      {
        title: "Recursion Practice Exercises",
        type: "material",
        date: "Feb 26",
        status: "reference",
        skills: ["base case", "recursive case", "call stack"],
        reviewPrompt:
          "Trace recursive calls step by step, then explain the return order.",
        resources: [
          reference(
            "Runestone recursion day 1",
            "https://runestone.academy/ns/books/published/csawesome/Unit10-Recursion/topic-10-1-recursion-day1.html",
          ),
          reference(
            "Runestone recursion day 2",
            "https://runestone.academy/ns/books/published/csawesome/Unit10-Recursion/topic-10-1-recursion-day2.html",
          ),
        ],
      },
      {
        title: "Recursion Intro",
        type: "material",
        date: "Feb 19",
        status: "reference",
        skills: ["definition", "call stack", "self-similar problems"],
        reviewPrompt:
          "Explain recursion using the smallest possible example, then draw the stack.",
        resources: [
          reference(
            "Tracing practice exercises",
            "https://opendsa-server.cs.vt.edu/ODSA/Books/cnu/cpsc255/spring-2020/CPSC255SP2020/html/TracingEx.html",
          ),
        ],
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
        title: "Java Graphics",
        type: "material",
        date: "Apr 27",
        status: "reference",
        skills: ["drawing APIs", "panels", "repaint"],
        reviewPrompt:
          "Summarize the minimum setup needed to draw and refresh a Java graphics view.",
        resources: [
          video("Java 2D canvas graphics", "https://www.youtube.com/watch?v=KcEvHq8Pqs0"),
          video(
            "Java graphics programming: shapes, paths, curves, transforms",
            "https://www.youtube.com/watch?v=zCiMlbu1-aQ",
          ),
          video(
            "Displaying images and drawing shapes in Java",
            "https://www.youtube.com/watch?v=UNLRwpcOldc",
          ),
          video("Java 2D animation", "https://www.youtube.com/watch?v=tHNWIWxRDDA"),
          website(
            "Drawing and coloring shapes on a JFrame",
            "https://medium.com/@michael71314/java-lesson-21-drawing-and-coloring-shapes-on-the-jframe-d740970e1d68",
          ),
          website("Java AWT graphics", "https://www.geeksforgeeks.org/java/what-is-java-awt-graphics/"),
        ],
      },
      {
        title: "Game Lab",
        type: "material",
        date: "May 7",
        status: "reference",
        skills: ["game loop", "Pong", "collision", "input"],
        reviewPrompt:
          "Plan a simple Pong-style game with update, draw, input, and collision methods.",
        resources: [website("Simple 2D Pong in Java", "https://kevinsguides.com/guides/code/java/javaprojs/simple-2d-pong/")],
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
