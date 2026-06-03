"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  MessageCircle,
  Mic,
  MicOff,
  Video,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  Tldraw,
  createShapeId,
  toRichText,
  type Editor,
  type TLArrowShape,
  type TLCreateShapePartial,
  type TLComponents,
  type TLGeoShape,
  type TLShape,
  type TLShapeId,
  type TLTextShape,
} from "tldraw";
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

type CanvasStats = {
  shapeCount: number;
  summary: string;
};

const EMPTY_CANVAS_STATS: CanvasStats = {
  shapeCount: 0,
  summary: "empty tldraw canvas",
};

const TLDRAW_COMPONENTS: TLComponents = {
  HelpMenu: null,
  SharePanel: null,
  StylePanel: null,
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

function initialPrompt(topic: CurriculumTopic, lesson: CurriculumItem) {
  return `Teach "${lesson.title}" in ${topic.name}. Keep it short, draw on the tldraw board if a visual helps, then ask me one question.`;
}

function summarizeShapes(editor: Editor): CanvasStats {
  const shapes = editor.getCurrentPageShapesSorted();

  if (!shapes.length) {
    return EMPTY_CANVAS_STATS;
  }

  const counts = shapes.reduce<Record<string, number>>((acc, shape) => {
    acc[shape.type] = (acc[shape.type] ?? 0) + 1;
    return acc;
  }, {});

  const labels = shapes
    .map((shape) => {
      if (shape.type === "geo") {
        return textFromRichText((shape as TLGeoShape).props.richText);
      }
      if (shape.type === "text") {
        return textFromRichText((shape as TLTextShape).props.richText);
      }
      if (shape.type === "arrow") {
        return textFromRichText((shape as TLArrowShape).props.richText);
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 8);

  const summary = [
    `${shapes.length} tldraw shapes`,
    Object.entries(counts)
      .map(([type, count]) => `${count} ${type}`)
      .join(", "),
    labels.length ? `visible labels: ${labels.join(" / ")}` : "no visible labels",
  ].join("; ");

  return {
    shapeCount: shapes.length,
    summary,
  };
}

function textFromRichText(richText: unknown): string {
  if (!richText || typeof richText !== "object") return "";

  const result: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if ("text" in node && typeof node.text === "string") {
      result.push(node.text);
    }
    if ("content" in node && Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
  };

  walk(richText);
  return result.join(" ").trim();
}

function diagramLayout(diagram: Diagram) {
  const nodeWidth = diagram.kind === "stack" ? 240 : 220;
  const nodeHeight = 92;
  const gapX = 90;
  const gapY = 82;
  const columns = diagram.kind === "stack" ? 1 : Math.min(3, Math.max(1, diagram.nodes.length));
  const rows = Math.ceil(diagram.nodes.length / columns);
  const width = columns * nodeWidth + (columns - 1) * gapX;
  const height = rows * nodeHeight + (rows - 1) * gapY;
  const startX = -width / 2;
  const startY = -height / 2 + 70;

  const positions = new Map<string, { x: number; y: number; cx: number; cy: number }>();
  diagram.nodes.forEach((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + column * (nodeWidth + gapX);
    const y = startY + row * (nodeHeight + gapY);
    positions.set(node.id, {
      x,
      y,
      cx: x + nodeWidth / 2,
      cy: y + nodeHeight / 2,
    });
  });

  return {
    nodeWidth,
    nodeHeight,
    positions,
    bounds: new Box(startX - 90, startY - 126, width + 180, height + 226),
  };
}

function colorForDiagram(kind: Diagram["kind"]): TLGeoShape["props"]["color"] {
  if (kind === "uml") return "violet";
  if (kind === "array") return "blue";
  if (kind === "stack") return "orange";
  if (kind === "maze") return "green";
  return "light-green";
}

function drawDiagramOnTldraw(editor: Editor, diagram: Diagram) {
  const { nodeWidth, nodeHeight, positions, bounds } = diagramLayout(diagram);
  const color = colorForDiagram(diagram.kind);
  const shapes: TLCreateShapePartial<TLShape>[] = [
    {
      id: createShapeId(`title-${Date.now()}`),
      type: "text",
      x: bounds.x,
      y: bounds.y,
      props: {
        richText: toRichText(diagram.title),
        autoSize: false,
        w: Math.max(360, bounds.w),
        size: "xl",
        color,
        font: "sans",
      },
    } satisfies TLCreateShapePartial<TLTextShape>,
  ];

  diagram.nodes.forEach((node) => {
    const position = positions.get(node.id);
    if (!position) return;

    const shapeId = createShapeId(`node-${node.id}-${Date.now()}`);
    shapes.push({
      id: shapeId,
      type: "geo",
      x: position.x,
      y: position.y,
      props: {
        geo: "rectangle",
        w: nodeWidth,
        h: nodeHeight,
        richText: toRichText(node.detail ? `${node.label}\n${node.detail}` : node.label),
        color,
        labelColor: "black",
        fill: "semi",
        dash: "solid",
        size: "m",
        font: "sans",
        align: "middle",
        verticalAlign: "middle",
      },
    } satisfies TLCreateShapePartial<TLGeoShape>);
  });

  for (const edge of diagram.edges ?? []) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) continue;

    shapes.push({
      id: createShapeId(`edge-${edge.from}-${edge.to}-${Date.now()}`),
      type: "arrow",
      x: from.cx,
      y: from.cy,
      props: {
        start: { x: 0, y: 0 },
        end: { x: to.cx - from.cx, y: to.cy - from.cy },
        richText: toRichText(edge.label ?? ""),
        color,
        labelColor: "black",
        size: "m",
        dash: "draw",
        arrowheadEnd: "arrow",
        kind: "arc",
      },
    } satisfies TLCreateShapePartial<TLArrowShape>);
  }

  const shapeIds = shapes.map((shape) => shape.id).filter((id): id is TLShapeId => Boolean(id));

  editor.run(() => {
    editor.createShapes(shapes);
    editor.select(...shapeIds);
    editor.zoomToBounds(bounds, {
      inset: 96,
      targetZoom: 1,
      animation: { duration: 260 },
    });
  });
}

export function LearnSciWorkspace() {
  const [selectedTopicId, setSelectedTopicId] = useState("culminating");
  const [expandedTopicId, setExpandedTopicId] = useState("culminating");
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
  const [quizCards, setQuizCards] = useState<QuizCard[]>([]);
  const [canvasStats, setCanvasStats] = useState<CanvasStats>(EMPTY_CANVAS_STATS);

  const editorRef = useRef<Editor | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  const selectedTopic = useMemo(() => getTopic(selectedTopicId), [selectedTopicId]);
  const selectedLesson = selectedTopic.items[selectedLessonIndex] ?? selectedTopic.items[0];
  const selectedVideos = selectedLesson.videos ?? selectedTopic.videos ?? [];
  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant");

  const updateCanvasStats = useCallback((editor = editorRef.current) => {
    if (!editor) return;
    setCanvasStats(summarizeShapes(editor));
  }, []);

  const addMessage = useCallback((role: Message["role"], text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [...current, { id: uid(role), role, text: text.trim() }].slice(-14));
  }, []);

  const boardSummary = useCallback(() => {
    return [
      canvasStats.summary,
      `unit ${selectedTopic.name}`,
      `lesson ${selectedLesson.title}`,
    ].join("; ");
  }, [canvasStats.summary, selectedLesson.title, selectedTopic.name]);

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
          const editor = editorRef.current;
          if (editor) {
            drawDiagramOnTldraw(editor, toolCall.arguments);
            updateCanvasStats(editor);
          }
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
    [updateCanvasStats],
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
    setExpandedTopicId(topicId);
    setSelectedLessonIndex(0);
  };

  const toggleTopic = (topicId: string) => {
    if (expandedTopicId === topicId) {
      setExpandedTopicId("");
      return;
    }

    chooseTopic(topicId);
  };

  const chooseLesson = (topicId: string, index: number) => {
    if (topicId !== selectedTopicId) {
      setSelectedTopicId(topicId);
      setExpandedTopicId(topicId);
    }
    setSelectedLessonIndex(index);
  };

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      editor.user.updateUserPreferences({ colorScheme: "dark", isSnapMode: true });
      updateCanvasStats(editor);

      return editor.store.listen(() => updateCanvasStats(editor));
    },
    [updateCanvasStats],
  );

  return (
    <main className="learn-app">
      <aside className="lesson-rail" aria-label="Lessons">
        <div className="rail-scroll">
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
            <nav className="unit-accordion" aria-label="Course units">
              {curriculum.map((topic) => {
                const isExpanded = topic.id === expandedTopicId;
                const isSelected = topic.id === selectedTopicId;

                return (
                  <section
                    className={classNames("unit-group", isSelected && "active")}
                    key={topic.id}
                  >
                    <button
                      aria-expanded={isExpanded}
                      className="unit-button"
                      onClick={() => toggleTopic(topic.id)}
                      type="button"
                    >
                      <span className="unit-dot" style={{ background: topic.accent }} />
                      <span>{topic.name}</span>
                      {isExpanded ? (
                        <ChevronDown size={14} aria-hidden="true" />
                      ) : (
                        <ChevronRight size={14} aria-hidden="true" />
                      )}
                    </button>

                    {isExpanded ? (
                      <div className="lesson-list" aria-label={`${topic.name} lessons`}>
                        {topic.items.map((lesson, index) => (
                          <button
                            className={classNames(
                              "lesson-button",
                              isSelected && index === selectedLessonIndex && "active",
                            )}
                            key={`${topic.id}-${lesson.title}-${index}`}
                            onClick={() => chooseLesson(topic.id, index)}
                            type="button"
                          >
                            <BookOpen size={13} aria-hidden="true" />
                            <span>{lesson.title}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </nav>
          </div>

          <section className="lesson-context" aria-label="Selected lesson">
            <span className="lesson-kicker">{selectedTopic.name}</span>
            <h2>{selectedLesson.title}</h2>
            <p>{selectedLesson.reviewPrompt}</p>
            <div className="skill-list">
              {selectedLesson.skills.slice(0, 4).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <button
              className="start-lesson"
              disabled={sessionState === "thinking"}
              onClick={() => sendPrompt(initialPrompt(selectedTopic, selectedLesson))}
              type="button"
            >
              Start lesson
            </button>
          </section>

          {selectedVideos.length ? (
            <section className="video-stack" aria-label="YouTube videos">
              <span className="rail-label">Videos</span>
              {selectedVideos.map((video) => (
                <a href={video.url} key={video.url} rel="noreferrer" target="_blank">
                  <Video size={14} aria-hidden="true" />
                  <span>{video.title}</span>
                </a>
              ))}
            </section>
          ) : null}

          <section className="answer-thread" aria-live="polite">
            <span>{status}</span>
            <p>{latestAssistant?.text ?? "Click the bubble and talk. The tutor can draw here."}</p>
            {quizCards.length ? (
              <details className="review-card">
                <summary>{quizCards[0].question}</summary>
                <p>{quizCards[0].answer}</p>
              </details>
            ) : null}
          </section>
        </div>
      </aside>

      <section className="tldraw-stage" aria-label="tldraw study board">
        <Tldraw
          autoFocus
          components={TLDRAW_COMPONENTS}
          onMount={handleMount}
          persistenceKey="learnsci-study-canvas"
        />
      </section>

      <button
        aria-label={sessionState === "recording" ? "Stop talking to LearnSci" : "Talk to LearnSci"}
        className={classNames(
          "voice-bubble",
          sessionState === "recording" && "recording",
          sessionState === "thinking" && "thinking",
          sessionState === "error" && "error",
        )}
        disabled={sessionState === "thinking"}
        onClick={startRecording}
        type="button"
      >
        <span className="voice-icon">
          {sessionState === "recording" ? (
            <MicOff size={22} aria-hidden="true" />
          ) : sessionState === "idle" ? (
            <MessageCircle size={22} aria-hidden="true" />
          ) : (
            <Mic size={22} aria-hidden="true" />
          )}
        </span>
        <span className="voice-copy">
          {sessionState === "recording" ? "Listening" : sessionState === "thinking" ? "Thinking" : "Talk"}
        </span>
      </button>
    </main>
  );
}
