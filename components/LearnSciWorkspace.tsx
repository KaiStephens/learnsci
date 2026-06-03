"use client";

import {
  BookOpen,
  ChevronRight,
  Circle,
  GraduationCap,
  Mic,
  MicOff,
  PenLine,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from "lucide-react";
import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { curriculum, getTopic, type CurriculumItem, type CurriculumTopic } from "@/lib/curriculum";
import type { TutorToolCall } from "@/lib/openrouter";

type SessionState = "idle" | "recording" | "thinking" | "error";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
};

type QuizCard = {
  id: string;
  topicId: string;
  question: string;
  answer: string;
};

type DiagramNode = {
  id: string;
  label: string;
  detail?: string;
};

type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
};

export type Diagram = {
  title: string;
  kind: "uml" | "stack" | "array" | "flow" | "maze" | "timeline" | "concept";
  nodes: DiagramNode[];
  edges?: DiagramEdge[];
};

type TutorResponse = {
  transcript?: string;
  assistant?: string;
  toolCalls?: TutorToolCall[];
  audio?: {
    dataUrl: string;
    mimeType: string;
  };
  error?: string;
};

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: string;
  points: Point[];
};

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function preferredAudioMime() {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return options.find((option) => MediaRecorder.isTypeSupported(option)) ?? "";
}

function formatFromMime(mimeType: string) {
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function lessonQuestions(topic: CurriculumTopic, lesson: CurriculumItem) {
  const firstSkill = lesson.skills[0] ?? topic.name;
  return [
    `Teach me ${lesson.title} from scratch.`,
    `Quiz me on ${firstSkill} and explain each answer.`,
    `Draw a diagram for ${lesson.title}.`,
    lesson.reviewPrompt,
  ];
}

function initialPrompt(topic: CurriculumTopic, lesson: CurriculumItem) {
  return `Teach the lesson "${lesson.title}" in ${topic.name}. Start with the core idea, then ask me one question. Use the canvas if a diagram helps.`;
}

export function LearnSciWorkspace() {
  const [selectedTopicId, setSelectedTopicId] = useState("culminating");
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [status, setStatus] = useState("Ready");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-start",
      role: "system",
      text: "Pick a lesson, draw, ask, or talk.",
    },
  ]);
  const [input, setInput] = useState("");
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [quizCards, setQuizCards] = useState<QuizCard[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  const selectedTopic = useMemo(() => getTopic(selectedTopicId), [selectedTopicId]);
  const selectedLesson = selectedTopic.items[selectedLessonIndex] ?? selectedTopic.items[0];
  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const latestUser = [...messages].reverse().find((message) => message.role === "user");
  const questions = useMemo(
    () => lessonQuestions(selectedTopic, selectedLesson),
    [selectedLesson, selectedTopic],
  );

  const addMessage = useCallback((role: Message["role"], text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [...current, { id: uid(role), role, text: text.trim() }].slice(-14));
  }, []);

  const boardSummary = useCallback(() => {
    return [
      `${strokeCount} ink groups`,
      diagram ? `diagram "${diagram.title}" with ${diagram.nodes.length} nodes` : "no diagram",
      `unit ${selectedTopic.name}`,
      `lesson ${selectedLesson.title}`,
    ].join("; ");
  }, [diagram, selectedLesson.title, selectedTopic.name, strokeCount]);

  const playAudio = useCallback((dataUrl?: string) => {
    if (!dataUrl) return;
    playerRef.current?.pause();
    const audio = new Audio(dataUrl);
    playerRef.current = audio;
    void audio.play().catch(() => {
      setStatus("Audio ready");
    });
  }, []);

  const applyToolCalls = useCallback(
    (toolCalls: TutorToolCall[] = []) => {
      for (const toolCall of toolCalls) {
        if (toolCall.name === "draw_diagram") {
          setDiagram(toolCall.arguments);
        }

        if (toolCall.name === "highlight_topic") {
          setSelectedTopicId(toolCall.arguments.topicId);
          setSelectedLessonIndex(0);
        }

        if (toolCall.name === "create_quiz_card") {
          setQuizCards((cards) => [
            {
              id: uid("quiz"),
              topicId: toolCall.arguments.topicId,
              question: toolCall.arguments.question,
              answer: toolCall.arguments.answer,
            },
            ...cards,
          ].slice(0, 6));
        }
      }
    },
    [],
  );

  const handleTutorResponse = useCallback(
    (response: TutorResponse) => {
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.transcript) {
        addMessage("user", response.transcript);
      }

      if (response.assistant) {
        addMessage("assistant", response.assistant);
      }

      applyToolCalls(response.toolCalls);
      playAudio(response.audio?.dataUrl);
    },
    [addMessage, applyToolCalls, playAudio],
  );

  const requestTutor = useCallback(
    async (endpoint: "/api/tutor/chat" | "/api/tutor/voice", body: Record<string, unknown>) => {
      setSessionState("thinking");
      setStatus("Thinking");

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topicId: selectedTopicId,
            boardSummary: boardSummary(),
            history: messages.map((message) => ({
              role: message.role,
              text: message.text,
            })),
            ...body,
          }),
        });

        const json = (await response.json()) as TutorResponse;

        if (!response.ok) {
          throw new Error(json.error ?? "Tutor request failed");
        }

        handleTutorResponse(json);
        setSessionState("idle");
        setStatus("Ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tutor request failed";
        setSessionState("error");
        setStatus("Error");
        addMessage("system", message);
      }
    },
    [addMessage, boardSummary, handleTutorResponse, messages, selectedTopicId],
  );

  const sendPrompt = useCallback(
    (message: string, speak = true) => {
      if (!message.trim() || sessionState === "thinking") return;
      void requestTutor("/api/tutor/chat", { message, speak });
    },
    [requestTutor, sessionState],
  );

  const submitText = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;
    setInput("");
    sendPrompt(message);
  };

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (sessionState === "recording") {
      stopRecording();
      return;
    }

    if (sessionState === "thinking") return;

    try {
      const mimeType = preferredAudioMime();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;

        if (blob.size < 1000) {
          setSessionState("idle");
          setStatus("Too short");
          return;
        }

        void blobToBase64(blob).then((audioBase64) =>
          requestTutor("/api/tutor/voice", {
            audioBase64,
            audioFormat: formatFromMime(blob.type),
            durationMs,
          }),
        );
      };

      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.start();
      setSessionState("recording");
      setStatus("Recording");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Microphone unavailable";
      setSessionState("error");
      setStatus("Error");
      addMessage("system", message);
    }
  }, [addMessage, requestTutor, sessionState, stopRecording]);

  const chooseTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setSelectedLessonIndex(0);
    setDiagram(null);
  };

  const chooseLesson = (index: number) => {
    setSelectedLessonIndex(index);
    setDiagram(null);
  };

  const askAboutBoard = () => {
    sendPrompt("Use the current drawing and lesson context to teach the next step.");
  };

  return (
    <main className="learn-app">
      <aside className="lesson-rail" aria-label="Lessons">
        <div className="rail-brand">
          <div className="rail-mark">
            <GraduationCap size={18} aria-hidden="true" />
          </div>
          <div>
            <h1>LearnSci</h1>
            <span>ICS4U</span>
          </div>
        </div>

        <div className="rail-section">
          <span className="rail-label">Units</span>
          <nav className="unit-list" aria-label="Course units">
            {curriculum.map((topic) => (
              <button
                className={classNames("unit-button", topic.id === selectedTopicId && "active")}
                key={topic.id}
                onClick={() => chooseTopic(topic.id)}
                type="button"
              >
                <span className="unit-dot" style={{ background: topic.accent }} />
                <span>{topic.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="rail-section lesson-queue">
          <span className="rail-label">Lessons</span>
          <div className="lesson-list">
            {selectedTopic.items.map((lesson, index) => (
              <button
                className={classNames("lesson-button", index === selectedLessonIndex && "active")}
                key={`${lesson.title}-${index}`}
                onClick={() => chooseLesson(index)}
                type="button"
              >
                <BookOpen size={14} aria-hidden="true" />
                <span>{lesson.title}</span>
                <ChevronRight size={13} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <button
          className={classNames("talk-button", sessionState === "recording" && "recording")}
          onClick={startRecording}
          type="button"
        >
          {sessionState === "recording" ? <MicOff size={17} /> : <Mic size={17} />}
          {sessionState === "recording" ? "Stop" : "Talk"}
        </button>
      </aside>

      <section className="canvas-stage" aria-label="Lesson canvas">
        <Whiteboard
          diagram={diagram}
          onAskAboutBoard={askAboutBoard}
          onClearDiagram={() => setDiagram(null)}
          onStrokeCountChange={setStrokeCount}
        />

        <div className="lesson-overlay">
          <div>
            <span className="lesson-kicker">{selectedTopic.name}</span>
            <h2>{selectedLesson.title}</h2>
            <p>{selectedLesson.reviewPrompt}</p>
          </div>
          <button
            className="start-lesson"
            disabled={sessionState === "thinking"}
            onClick={() => sendPrompt(initialPrompt(selectedTopic, selectedLesson))}
            type="button"
          >
            Start lesson
          </button>
        </div>

        <div className="question-dock" aria-label="Practice questions">
          {questions.map((question) => (
            <button
              disabled={sessionState === "thinking"}
              key={question}
              onClick={() => sendPrompt(question)}
              type="button"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="answer-dock" aria-live="polite">
          <div className="answer-thread">
            <span>{status}</span>
            <p>
              {latestAssistant?.text ??
                latestUser?.text ??
                "Pick a lesson, then start teaching or ask a question."}
            </p>
          </div>
          {quizCards.length ? (
            <details className="review-card">
              <summary>{quizCards[0].question}</summary>
              <p>{quizCards[0].answer}</p>
            </details>
          ) : null}
        </div>

        <form className="ask-bar" onSubmit={submitText}>
          <input
            aria-label="Ask LearnSci"
            disabled={sessionState === "thinking" || sessionState === "recording"}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about this lesson..."
            value={input}
          />
          <button disabled={sessionState === "thinking"} title="Send" type="submit">
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
      </section>
    </main>
  );
}

function Whiteboard({
  diagram,
  onAskAboutBoard,
  onClearDiagram,
  onStrokeCountChange,
}: {
  diagram: Diagram | null;
  onAskAboutBoard: () => void;
  onClearDiagram: () => void;
  onStrokeCountChange: (count: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * scale));
    const height = Math.max(1, Math.floor(rect.height * scale));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = "#080909";
    context.fillRect(0, 0, rect.width, rect.height);

    context.fillStyle = "rgba(232, 238, 234, 0.075)";
    for (let x = 28; x < rect.width; x += 28) {
      for (let y = 28; y < rect.height; y += 28) {
        context.beginPath();
        context.arc(x, y, 1, 0, Math.PI * 2);
        context.fill();
      }
    }

    if (diagram) {
      drawDiagram(context, rect.width, rect.height, diagram);
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#f1f5f1";
    context.lineWidth = 2.1;

    for (const stroke of activeStroke ? [...strokes, activeStroke] : strokes) {
      context.beginPath();
      stroke.points.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.stroke();
    }
  }, [activeStroke, diagram, strokes]);

  const pointerPosition = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const beginStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveStroke({ id: uid("stroke"), points: [pointerPosition(event)] });
  };

  const extendStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!activeStroke) return;
    const point = pointerPosition(event);
    setActiveStroke((current) =>
      current ? { ...current, points: [...current.points, point] } : current,
    );
  };

  const endStroke = () => {
    if (!activeStroke) return;
    setStrokes((current) => {
      const next = [...current, activeStroke];
      onStrokeCountChange(next.length);
      return next;
    });
    setActiveStroke(null);
  };

  const clearStrokes = () => {
    setStrokes([]);
    setActiveStroke(null);
    onStrokeCountChange(0);
  };

  useEffect(() => {
    requestAnimationFrame(drawBoard);
  }, [drawBoard]);

  return (
    <>
      <canvas
        aria-label="Drawing canvas"
        className="lesson-canvas"
        onPointerDown={beginStroke}
        onPointerLeave={endStroke}
        onPointerMove={extendStroke}
        onPointerUp={endStroke}
        ref={canvasRef}
      />
      <div className="canvas-tools" aria-label="Canvas tools">
        <button title="Pen" type="button">
          <PenLine size={16} aria-hidden="true" />
        </button>
        <button onClick={onAskAboutBoard} title="Ask about canvas" type="button">
          <Sparkles size={16} aria-hidden="true" />
        </button>
        <button onClick={clearStrokes} title="Clear ink" type="button">
          <Trash2 size={16} aria-hidden="true" />
        </button>
        <button onClick={onClearDiagram} title="Clear diagram" type="button">
          <Square size={16} aria-hidden="true" />
        </button>
        <span>
          <Circle size={7} fill="currentColor" aria-hidden="true" />
          {strokes.length}
        </span>
        <span>
          <Volume2 size={12} aria-hidden="true" />
          {diagram ? "diagram" : "blank"}
        </span>
      </div>
    </>
  );
}

function drawDiagram(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  diagram: Diagram,
) {
  const nodeWidth = Math.min(180, Math.max(122, width / 5));
  const nodeHeight = 58;
  const gap = 26;
  const columns = diagram.kind === "stack" ? 1 : Math.min(3, Math.max(1, diagram.nodes.length));
  const rows = Math.ceil(diagram.nodes.length / columns);
  const totalWidth = columns * nodeWidth + (columns - 1) * gap;
  const startX = Math.max(34, (width - totalWidth) / 2);
  const startY = Math.max(142, (height - rows * (nodeHeight + gap)) / 2);

  const positions = new Map<string, { x: number; y: number; cx: number; cy: number }>();

  context.save();
  context.font = "600 13px ui-sans-serif, system-ui";
  context.fillStyle = "#f1f5f1";
  context.fillText(diagram.title, 34, 92);

  diagram.nodes.forEach((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + column * (nodeWidth + gap);
    const y = startY + row * (nodeHeight + gap);
    positions.set(node.id, { x, y, cx: x + nodeWidth / 2, cy: y + nodeHeight / 2 });
  });

  context.strokeStyle = "rgba(150, 230, 188, 0.62)";
  context.fillStyle = "rgba(150, 230, 188, 0.82)";
  context.lineWidth = 1.5;

  for (const edge of diagram.edges ?? []) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) continue;

    context.beginPath();
    context.moveTo(from.cx, from.cy);
    context.lineTo(to.cx, to.cy);
    context.stroke();

    if (edge.label) {
      context.fillText(edge.label, (from.cx + to.cx) / 2 + 5, (from.cy + to.cy) / 2 - 5);
    }
  }

  diagram.nodes.forEach((node) => {
    const position = positions.get(node.id);
    if (!position) return;

    context.fillStyle = "rgba(13, 15, 15, 0.96)";
    context.strokeStyle = "rgba(232, 238, 234, 0.24)";
    roundRect(context, position.x, position.y, nodeWidth, nodeHeight, 8);
    context.fill();
    context.stroke();

    context.fillStyle = "#f1f5f1";
    context.font = "600 12px ui-sans-serif, system-ui";
    context.fillText(node.label.slice(0, 23), position.x + 12, position.y + 22);
    if (node.detail) {
      context.fillStyle = "#9aa49e";
      context.font = "11px ui-sans-serif, system-ui";
      context.fillText(node.detail.slice(0, 28), position.x + 12, position.y + 42);
    }
  });

  context.restore();
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
