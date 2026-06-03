"use client";

import {
  BookOpen,
  Bot,
  Brain,
  Check,
  ChevronRight,
  Circle,
  Command,
  GraduationCap,
  Mic,
  MicOff,
  PenLine,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  WalletCards,
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
import { classroomScan, curriculum, getTopic, type CurriculumTopic } from "@/lib/curriculum";
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
  usage?: {
    estimatedUsd: number;
    requests: number;
  };
  error?: string;
};

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function topicProgress(topic: CurriculumTopic) {
  const completed = topic.items.filter((item) => item.status === "completed").length;
  return Math.round((completed / topic.items.length) * 100);
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

export function LearnSciWorkspace() {
  const [selectedTopicId, setSelectedTopicId] = useState("culminating");
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [status, setStatus] = useState("OpenRouter pipeline idle");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-start",
      role: "system",
      text: "Choose a unit, talk or type, and use the canvas while you study. The curriculum outline is sanitized from Classroom titles and topics.",
    },
  ]);
  const [input, setInput] = useState("");
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [quizCards, setQuizCards] = useState<QuizCard[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);
  const [usageUsd, setUsageUsd] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  const selectedTopic = useMemo(() => getTopic(selectedTopicId), [selectedTopicId]);

  const addMessage = useCallback((role: Message["role"], text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [...current, { id: uid(role), role, text: text.trim() }].slice(-20));
  }, []);

  const boardSummary = useCallback(() => {
    return [
      `${strokeCount} freehand ink groups`,
      diagram ? `AI diagram "${diagram.title}" with ${diagram.nodes.length} nodes` : "no AI diagram",
      `active topic ${selectedTopic.name}`,
    ].join("; ");
  }, [diagram, selectedTopic.name, strokeCount]);

  const playAudio = useCallback((dataUrl?: string) => {
    if (!dataUrl) return;
    playerRef.current?.pause();
    const audio = new Audio(dataUrl);
    playerRef.current = audio;
    void audio.play().catch(() => {
      setStatus("Speech generated; browser blocked autoplay");
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
          ].slice(0, 10));
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

      if (response.usage) {
        setUsageUsd(response.usage.estimatedUsd);
      }
    },
    [addMessage, applyToolCalls, playAudio],
  );

  const requestTutor = useCallback(
    async (endpoint: "/api/tutor/chat" | "/api/tutor/voice", body: Record<string, unknown>) => {
      setSessionState("thinking");
      setStatus("Transcribe, reason, draw, speak");

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
        setStatus("OpenRouter pipeline idle");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tutor request failed";
        setSessionState("error");
        setStatus(message);
        addMessage("system", message);
      }
    },
    [addMessage, boardSummary, handleTutorResponse, messages, selectedTopicId],
  );

  const submitText = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || sessionState === "thinking") return;
    setInput("");
    void requestTutor("/api/tutor/chat", { message, speak: true });
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
          setStatus("Recording was too short");
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
      setStatus(message);
      addMessage("system", message);
    }
  }, [addMessage, requestTutor, sessionState, stopRecording]);

  const askAboutBoard = () => {
    if (sessionState === "thinking") return;
    void requestTutor("/api/tutor/chat", {
      message: "Use the current board state to improve the diagram or explain what I should add next.",
      speak: true,
    });
  };

  return (
    <main className="app-shell workspace">
      <aside className="sidebar" aria-label="Curriculum">
        <div className="brand-row">
          <div className="brand-mark">
            <GraduationCap size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">LearnSci</p>
            <h1>ICS4U review</h1>
          </div>
        </div>

        <div className="source-card">
          <div className="source-icon">
            <BookOpen size={15} aria-hidden="true" />
          </div>
          <div>
            <span>{classroomScan.course}</span>
            <small>{classroomScan.scannedAt} Firefox scan</small>
          </div>
        </div>

        <nav className="topic-list" aria-label="Study units">
          {curriculum.map((topic) => {
            const progress = topicProgress(topic);
            const selected = topic.id === selectedTopicId;

            return (
              <button
                key={topic.id}
                className={classNames("topic-button", selected && "selected")}
                onClick={() => setSelectedTopicId(topic.id)}
                type="button"
              >
                <span className="topic-dot" style={{ background: topic.accent }} />
                <span className="topic-copy">
                  <strong>{topic.name}</strong>
                  <span>{progress}% reviewed from classwork</span>
                </span>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            );
          })}
        </nav>

        <div className="connection-card">
          <div className="connection-state">
            <WalletCards size={16} />
            <span>${usageUsd.toFixed(4)} / $10 local cap</span>
          </div>
          <button
            className={classNames("primary-button", sessionState === "recording" && "danger-button")}
            onClick={startRecording}
            type="button"
          >
            {sessionState === "recording" ? <MicOff size={16} /> : <Mic size={16} />}
            {sessionState === "recording" ? "Stop and send" : "Talk"}
          </button>
        </div>
      </aside>

      <section className="lesson-panel" aria-label="Selected topic">
        <header className="lesson-header">
          <div>
            <p className="eyebrow">{selectedTopic.examWeight} review</p>
            <h2>{selectedTopic.name}</h2>
          </div>
          <span className="model-pill">
            <Bot size={15} aria-hidden="true" />
            OpenRouter
          </span>
        </header>

        <p className="objective">{selectedTopic.objective}</p>

        <div className="checkpoint-grid">
          {selectedTopic.checkpoints.map((checkpoint) => (
            <div className="checkpoint" key={checkpoint}>
              <Check size={14} aria-hidden="true" />
              <span>{checkpoint}</span>
            </div>
          ))}
        </div>

        <div className="section-title">
          <Command size={15} aria-hidden="true" />
          <span>Classroom sequence</span>
        </div>
        <div className="item-list">
          {selectedTopic.items.map((item) => (
            <article className="classwork-item" key={item.title}>
              <div>
                <span className={`item-type ${item.type}`}>{item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.reviewPrompt}</p>
              </div>
              <div className="item-meta">
                <span>{item.due ? `Due ${item.due}` : item.date}</span>
                <small>{item.skills.slice(0, 3).join(" / ")}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-panel" aria-label="Tutor and whiteboard">
        <div className="tutor-card">
          <header className="panel-header">
            <div>
              <p className="eyebrow">MAI voice loop</p>
              <h2>Transcribe, tutor, speak</h2>
            </div>
            <span className={classNames("status-dot", sessionState)} />
          </header>

          <div className="pipeline-strip" aria-label="Active model pipeline">
            <span>microsoft/mai-transcribe-1.5</span>
            <span>openai/gpt-5.4-mini</span>
            <span>microsoft/mai-voice-2</span>
          </div>

          <div className="message-log" aria-live="polite">
            {messages.map((message) => (
              <div className={`message ${message.role}`} key={message.id}>
                <span>{message.role}</span>
                <p>{message.text}</p>
              </div>
            ))}
            {sessionState === "thinking" ? (
              <div className="message assistant live">
                <span>system</span>
                <p>{status}</p>
              </div>
            ) : null}
          </div>

          <form className="composer" onSubmit={submitText}>
            <input
              aria-label="Ask LearnSci"
              disabled={sessionState === "thinking" || sessionState === "recording"}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask for a trace, quiz, UML sketch, or exam drill..."
              value={input}
            />
            <button disabled={sessionState === "thinking"} title="Send" type="submit">
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </div>

        <Whiteboard
          diagram={diagram}
          onAskAboutBoard={askAboutBoard}
          onClearDiagram={() => setDiagram(null)}
          onStrokeCountChange={setStrokeCount}
        />

        <div className="quiz-strip" aria-label="Saved quiz cards">
          <div className="section-title">
            <Brain size={15} aria-hidden="true" />
            <span>Saved review cards</span>
          </div>
          {quizCards.length ? (
            quizCards.map((card) => (
              <details className="quiz-card" key={card.id}>
                <summary>{card.question}</summary>
                <p>{card.answer}</p>
              </details>
            ))
          ) : (
            <p className="empty-copy">Ask the tutor to save quiz cards while you review.</p>
          )}
        </div>
      </section>
    </main>
  );
}

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: string;
  points: Point[];
};

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
    context.fillStyle = "#0a0c0c";
    context.fillRect(0, 0, rect.width, rect.height);

    context.fillStyle = "rgba(239, 243, 239, 0.08)";
    for (let x = 20; x < rect.width; x += 24) {
      for (let y = 20; y < rect.height; y += 24) {
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
    context.strokeStyle = "#eff3ef";
    context.lineWidth = 2.2;

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
    <div className="whiteboard-card">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Board</p>
          <h2>Canvas notes</h2>
        </div>
        <div className="board-tools">
          <button title="Pen" type="button">
            <PenLine size={15} aria-hidden="true" />
          </button>
          <button onClick={onAskAboutBoard} title="Ask AI about board" type="button">
            <Sparkles size={15} aria-hidden="true" />
          </button>
          <button onClick={clearStrokes} title="Clear ink" type="button">
            <Trash2 size={15} aria-hidden="true" />
          </button>
          <button onClick={onClearDiagram} title="Clear AI diagram" type="button">
            <Square size={15} aria-hidden="true" />
          </button>
        </div>
      </header>
      <canvas
        aria-label="Drawing canvas"
        className="whiteboard-canvas"
        onPointerDown={beginStroke}
        onPointerLeave={endStroke}
        onPointerMove={extendStroke}
        onPointerUp={endStroke}
        ref={canvasRef}
      />
      <div className="board-footer">
        <span>
          <Circle size={8} fill="currentColor" aria-hidden="true" />
          {strokes.length} ink groups
        </span>
        <span>
          <Volume2 size={12} aria-hidden="true" />
          {diagram ? `${diagram.title} diagram` : "No AI diagram yet"}
        </span>
      </div>
    </div>
  );
}

function drawDiagram(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  diagram: Diagram,
) {
  const nodeWidth = Math.min(172, Math.max(112, width / 4.2));
  const nodeHeight = 58;
  const gap = 22;
  const columns = diagram.kind === "stack" ? 1 : Math.min(3, Math.max(1, diagram.nodes.length));
  const rows = Math.ceil(diagram.nodes.length / columns);
  const totalWidth = columns * nodeWidth + (columns - 1) * gap;
  const startX = Math.max(24, (width - totalWidth) / 2);
  const startY = Math.max(58, (height - rows * (nodeHeight + gap)) / 2);

  const positions = new Map<string, { x: number; y: number; cx: number; cy: number }>();

  context.save();
  context.font = "600 13px ui-sans-serif, system-ui";
  context.fillStyle = "#eff3ef";
  context.fillText(diagram.title, 24, 32);

  diagram.nodes.forEach((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + column * (nodeWidth + gap);
    const y = startY + row * (nodeHeight + gap);
    positions.set(node.id, { x, y, cx: x + nodeWidth / 2, cy: y + nodeHeight / 2 });
  });

  context.strokeStyle = "rgba(143, 216, 255, 0.56)";
  context.fillStyle = "rgba(143, 216, 255, 0.76)";
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
      context.fillText(edge.label, (from.cx + to.cx) / 2 + 4, (from.cy + to.cy) / 2 - 4);
    }
  }

  diagram.nodes.forEach((node) => {
    const position = positions.get(node.id);
    if (!position) return;

    context.fillStyle = "rgba(20, 23, 23, 0.94)";
    context.strokeStyle = "rgba(239, 243, 239, 0.22)";
    roundRect(context, position.x, position.y, nodeWidth, nodeHeight, 8);
    context.fill();
    context.stroke();

    context.fillStyle = "#eff3ef";
    context.font = "600 12px ui-sans-serif, system-ui";
    context.fillText(node.label.slice(0, 22), position.x + 12, position.y + 22);
    if (node.detail) {
      context.fillStyle = "#9aa49e";
      context.font = "11px ui-sans-serif, system-ui";
      context.fillText(node.detail.slice(0, 26), position.x + 12, position.y + 42);
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
