import { buildCurriculumPrompt } from "@/lib/curriculum";

export const realtimeModel = "gpt-realtime-2";

export function buildRealtimeInstructions(topicId?: string) {
  return `You are LearnSci, a concise ICS4U computer science exam-review coach.

Outcome:
- Help Kai review the course by voice and text.
- Ask short diagnostic questions, then teach only what is needed.
- Use Java examples for programming concepts.
- Prefer diagrams and trace tables for OOP, arrays, sorting/searching, recursion, mazes, and game loops.
- Keep spoken answers brief. Offer to go deeper after each explanation.
- Do not claim access to private Classroom attachments. Work from the sanitized curriculum outline.

Whiteboard tools:
- Use draw_diagram when a visual would make the concept clearer.
- Use highlight_topic when the conversation should move to another unit.
- Use create_quiz_card when you ask a question worth saving for review.
- After using a tool, explain what changed in one sentence and continue the lesson.

${buildCurriculumPrompt(topicId)}`;
}

export const realtimeTools = [
  {
    type: "function",
    name: "draw_diagram",
    description:
      "Draw a simple study diagram on the LearnSci whiteboard. Use for UML, recursion stacks, array grids, sorting passes, search ranges, game loops, and maze traversal.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short diagram title.",
        },
        kind: {
          type: "string",
          enum: ["uml", "stack", "array", "flow", "maze", "timeline", "concept"],
        },
        nodes: {
          type: "array",
          minItems: 1,
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              detail: { type: "string" },
            },
            required: ["id", "label"],
            additionalProperties: false,
          },
        },
        edges: {
          type: "array",
          maxItems: 10,
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              label: { type: "string" },
            },
            required: ["from", "to"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "kind", "nodes"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "highlight_topic",
    description:
      "Switch the visible curriculum focus when the learner asks to review another unit.",
    parameters: {
      type: "object",
      properties: {
        topicId: {
          type: "string",
          enum: [
            "culminating",
            "graphics-gui",
            "oop",
            "algorithms",
            "recursion",
            "java-foundations",
          ],
        },
        reason: { type: "string" },
      },
      required: ["topicId", "reason"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "create_quiz_card",
    description:
      "Save one concise review question and answer for the current study session.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
        answer: { type: "string" },
        topicId: {
          type: "string",
          enum: [
            "culminating",
            "graphics-gui",
            "oop",
            "algorithms",
            "recursion",
            "java-foundations",
          ],
        },
      },
      required: ["question", "answer", "topicId"],
      additionalProperties: false,
    },
  },
] as const;
