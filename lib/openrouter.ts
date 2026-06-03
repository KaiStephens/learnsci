import { buildCurriculumPrompt, getTopic } from "@/lib/curriculum";

export type TutorRole = "user" | "assistant" | "system";

export type TutorHistoryMessage = {
  role: TutorRole;
  text: string;
};

export type TutorToolCall =
  | {
      name: "draw_diagram";
      arguments: {
        title: string;
        kind: "uml" | "stack" | "array" | "flow" | "maze" | "timeline" | "concept";
        nodes: Array<{ id: string; label: string; detail?: string }>;
        edges?: Array<{ from: string; to: string; label?: string }>;
      };
    }
  | {
      name: "highlight_topic";
      arguments: { topicId: string; reason: string };
    }
  | {
      name: "create_quiz_card";
      arguments: { topicId: string; question: string; answer: string };
    };

type ChatToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ChatToolCall[];
};

type ChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: ChatToolCall[];
    };
  }>;
  error?: {
    message?: string;
  };
};

type TranscriptionResult = {
  text?: string;
  error?: {
    message?: string;
  };
};

export const openRouterDefaults = {
  baseUrl: "https://openrouter.ai/api/v1",
  appTitle: "LearnSci",
  referer: "https://github.com/KaiStephens/learnsci",
  llmModel: "openai/gpt-5.4-mini",
  transcribeModel: "microsoft/mai-transcribe-1.5",
  speechModel: "microsoft/mai-voice-2",
  voice: "en-US-Harper:MAI-Voice-2",
};

export function getOpenRouterConfig() {
  return {
    apiKey: process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL ?? openRouterDefaults.baseUrl,
    llmModel: process.env.LEARNSCI_LLM_MODEL ?? openRouterDefaults.llmModel,
    transcribeModel:
      process.env.LEARNSCI_TRANSCRIBE_MODEL ?? openRouterDefaults.transcribeModel,
    speechModel: process.env.LEARNSCI_SPEECH_MODEL ?? openRouterDefaults.speechModel,
    voice: process.env.LEARNSCI_SPEECH_VOICE ?? openRouterDefaults.voice,
  };
}

export function requireOpenRouterKey() {
  const config = getOpenRouterConfig();

  if (!config.apiKey) {
    throw new Error(
      "Set OPENROUTER_API_KEY in .env.local. OPENAI_API_KEY is accepted only as a local alias for the same OpenRouter-compatible key.",
    );
  }

  return config as ReturnType<typeof getOpenRouterConfig> & { apiKey: string };
}

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": openRouterDefaults.referer,
    "X-Title": openRouterDefaults.appTitle,
  };
}

export const tutorTools = [
  {
    type: "function",
    function: {
      name: "draw_diagram",
      description:
        "Draw a simple study diagram on the learner's tldraw board. Use for UML, recursion stacks, array grids, sorting passes, search ranges, game loops, and maze traversal.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
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
  },
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
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
  },
] as const;

export function buildTutorSystemPrompt(topicId: string) {
  const topic = getTopic(topicId);

  return `You are LearnSci, a concise ICS4U computer science exam-review coach.

You are running in a voice pipeline:
1. MAI-Transcribe converts the learner's speech to text.
2. You reason and call tools.
3. MAI-Voice speaks your final answer.

Outcome:
- Help Kai review the course by voice and text.
- Ask short diagnostic questions, then teach only what is needed.
- Use Java examples for programming concepts.
- Prefer diagrams and trace tables for OOP, arrays, sorting/searching, recursion, mazes, and game loops.
- When a visual would help, call draw_diagram. The frontend turns that tool call into editable tldraw shapes.
- Keep spoken answers brief: normally 2-5 sentences.
- Do not claim access to private Classroom attachments. Work from the sanitized curriculum outline.
- If the learner asks for a diagram, call draw_diagram and still give a short spoken explanation.

Active unit: ${topic.name}
Active objective: ${topic.objective}

${buildCurriculumPrompt(topicId)}`;
}

function buildMessages(input: {
  topicId: string;
  userText: string;
  boardSummary: string;
  history: TutorHistoryMessage[];
}) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildTutorSystemPrompt(input.topicId),
    },
  ];

  for (const item of input.history.slice(-10)) {
    if (item.role === "system") continue;
    messages.push({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.text,
    });
  }

  messages.push({
    role: "user",
    content: `${input.userText}\n\nCurrent board state: ${input.boardSummary}`,
  });

  return messages;
}

function parseToolCalls(toolCalls: ChatToolCall[] = []): TutorToolCall[] {
  const parsedCalls: TutorToolCall[] = [];

  for (const toolCall of toolCalls) {
    try {
      const parsed = JSON.parse(toolCall.function.arguments) as TutorToolCall["arguments"];

      if (toolCall.function.name === "draw_diagram") {
        parsedCalls.push({
          name: "draw_diagram",
          arguments: parsed as Extract<TutorToolCall, { name: "draw_diagram" }>["arguments"],
        });
      }

      if (toolCall.function.name === "highlight_topic") {
        parsedCalls.push({
          name: "highlight_topic",
          arguments: parsed as Extract<TutorToolCall, { name: "highlight_topic" }>["arguments"],
        });
      }

      if (toolCall.function.name === "create_quiz_card") {
        parsedCalls.push({
          name: "create_quiz_card",
          arguments: parsed as Extract<TutorToolCall, { name: "create_quiz_card" }>["arguments"],
        });
      }
    } catch {
      continue;
    }
  }

  return parsedCalls;
}

async function postChat(messages: ChatMessage[], toolChoice: "auto" | "none") {
  const config = requireOpenRouterKey();

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: headers(config.apiKey),
    body: JSON.stringify({
      model: config.llmModel,
      messages,
      tools: tutorTools,
      tool_choice: toolChoice,
      temperature: 0.35,
      max_tokens: 900,
      reasoning: {
        effort: "low",
      },
      usage: {
        include: true,
      },
    }),
  });

  const json = (await response.json()) as ChatCompletion;

  if (!response.ok || json.error) {
    throw new Error(json.error?.message ?? `OpenRouter chat failed with ${response.status}`);
  }

  return json;
}

export async function runTutorTurn(input: {
  topicId: string;
  userText: string;
  boardSummary: string;
  history: TutorHistoryMessage[];
}) {
  const messages = buildMessages(input);
  const first = await postChat(messages, "auto");
  const firstMessage = first.choices?.[0]?.message;
  const toolCalls = parseToolCalls(firstMessage?.tool_calls);

  if (!toolCalls.length) {
    return {
      text: firstMessage?.content?.trim() || "I heard you. Ask me to drill a topic or draw a diagram.",
      toolCalls,
    };
  }

  const toolMessages: ChatMessage[] = [
    ...messages,
    {
      role: "assistant",
      content: firstMessage?.content ?? null,
      tool_calls: firstMessage?.tool_calls,
    },
    ...(firstMessage?.tool_calls ?? []).map((toolCall) => ({
      role: "tool" as const,
      tool_call_id: toolCall.id,
      name: toolCall.function.name,
      content: JSON.stringify({ ok: true, applied: toolCall.function.name }),
    })),
  ];

  const second = await postChat(toolMessages, "none");

  return {
    text:
      second.choices?.[0]?.message?.content?.trim() ||
      firstMessage?.content?.trim() ||
      "I updated the study workspace.",
    toolCalls,
  };
}

export async function transcribeAudio(input: {
  audioBase64: string;
  format: string;
  language?: string;
  durationMs?: number;
}) {
  const config = requireOpenRouterKey();

  const response = await fetch(`${config.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: headers(config.apiKey),
    body: JSON.stringify({
      input_audio: {
        data: input.audioBase64,
        format: input.format,
      },
      model: config.transcribeModel,
      language: input.language ?? "en",
    }),
  });

  const json = (await response.json()) as TranscriptionResult;

  if (!response.ok || json.error) {
    throw new Error(json.error?.message ?? `OpenRouter transcription failed with ${response.status}`);
  }

  return json.text?.trim() ?? "";
}

export async function synthesizeSpeech(text: string) {
  const config = requireOpenRouterKey();
  const trimmed = text.trim();

  const response = await fetch(`${config.baseUrl}/audio/speech`, {
    method: "POST",
    headers: headers(config.apiKey),
    body: JSON.stringify({
      model: config.speechModel,
      input: trimmed.slice(0, 1800),
      voice: config.voice,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `OpenRouter speech failed with ${response.status}`);
  }

  const mimeType = response.headers.get("content-type") ?? "audio/mpeg";
  const bytes = Buffer.from(await response.arrayBuffer());

  return {
    dataUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
    mimeType,
  };
}
