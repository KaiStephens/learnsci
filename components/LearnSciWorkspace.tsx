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
  Wifi,
  WifiOff,
} from "lucide-react";
import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import { classroomScan, curriculum, getTopic, type CurriculumTopic } from "@/lib/curriculum";

type ConnectionState = "idle" | "connecting" | "connected" | "error";

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

type ToolResult =
  | {
      name: "draw_diagram";
      arguments: Diagram;
    }
  | {
      name: "highlight_topic";
      arguments: { topicId: string; reason: string };
    }
  | {
      name: "create_quiz_card";
      arguments: { topicId: string; question: string; answer: string };
    };

type ServerEvent = {
  type: string;
  response?: {
    output?: Array<{
      type?: string;
      name?: string;
      arguments?: string;
      call_id?: string;
      content?: Array<{
        type?: string;
        text?: string;
        transcript?: string;
      }>;
    }>;
  };
  delta?: string;
  transcript?: string;
  error?: {
    message?: string;
  };
};

type ClientEvent = Record<string, unknown>;
type ResponseOutputItem = NonNullable<NonNullable<ServerEvent["response"]>["output"]>[number];

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function extractResponseText(event: ServerEvent) {
  const chunks: string[] = [];

  for (const item of event.response?.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.text) chunks.push(part.text);
      if (part.transcript) chunks.push(part.transcript);
    }
  }

  return chunks.join("\n").trim();
}

function parseToolCall(item: ResponseOutputItem): ToolResult | null {
  if (item.type !== "function_call" || !item.name || !item.arguments) {
    return null;
  }

  try {
    const parsed = JSON.parse(item.arguments) as ToolResult["arguments"];

    if (item.name === "draw_diagram") {
      return { name: "draw_diagram", arguments: parsed as Diagram };
    }

    if (item.name === "highlight_topic") {
      return {
        name: "highlight_topic",
        arguments: parsed as { topicId: string; reason: string },
      };
    }

    if (item.name === "create_quiz_card") {
      return {
        name: "create_quiz_card",
        arguments: parsed as { topicId: string; question: string; answer: string },
      };
    }
  } catch {
    return null;
  }

  return null;
}

function topicProgress(topic: CurriculumTopic) {
  const completed = topic.items.filter((item) => item.status === "completed").length;
  return Math.round((completed / topic.items.length) * 100);
}

export function LearnSciWorkspace() {
  const [selectedTopicId, setSelectedTopicId] = useState("culminating");
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [status, setStatus] = useState("Offline");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-start",
      role: "system",
      text: "Choose a unit, connect voice when ready, or type a question. The curriculum outline is sanitized from Classroom titles and topics.",
    },
  ]);
  const [input, setInput] = useState("");
  const [liveDraft, setLiveDraft] = useState("");
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [quizCards, setQuizCards] = useState<QuizCard[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedTopic = useMemo(() => getTopic(selectedTopicId), [selectedTopicId]);

  const addMessage = useCallback((role: Message["role"], text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [...current, { id: uid(role), role, text: text.trim() }].slice(-18));
  }, []);

  const sendEvent = useCallback((event: ClientEvent) => {
    const channel = dataChannelRef.current;

    if (!channel || channel.readyState !== "open") {
      setStatus("Realtime channel is not open");
      return false;
    }

    channel.send(JSON.stringify(event));
    return true;
  }, []);

  const stopSession = useCallback(() => {
    dataChannelRef.current?.close();
    pcRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioRef.current?.remove();

    dataChannelRef.current = null;
    pcRef.current = null;
    mediaStreamRef.current = null;
    audioRef.current = null;
    setConnectionState("idle");
    setLiveDraft("");
    setStatus("Offline");
  }, []);

  const handleToolCalls = useCallback(
    (event: ServerEvent) => {
      const calls = event.response?.output?.filter((item) => item.type === "function_call") ?? [];

      for (const item of calls) {
        const parsed = parseToolCall(item);

        if (!parsed || !item.call_id) continue;

        if (parsed.name === "draw_diagram") {
          setDiagram(parsed.arguments);
        }

        if (parsed.name === "highlight_topic") {
          setSelectedTopicId(parsed.arguments.topicId);
        }

        if (parsed.name === "create_quiz_card") {
          setQuizCards((cards) => [
            {
              id: uid("quiz"),
              topicId: parsed.arguments.topicId,
              question: parsed.arguments.question,
              answer: parsed.arguments.answer,
            },
            ...cards,
          ].slice(0, 8));
        }

        sendEvent({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: item.call_id,
            output: JSON.stringify({ ok: true, applied: parsed.name }),
          },
        });

        sendEvent({
          type: "response.create",
          response: {
            output_modalities: ["text", "audio"],
          },
        });
      }
    },
    [sendEvent],
  );

  const handleServerEvent = useCallback(
    (raw: MessageEvent<string>) => {
      const event = JSON.parse(raw.data) as ServerEvent;

      if (event.type === "session.created" || event.type === "session.updated") {
        setStatus("Realtime ready");
      }

      if (event.type === "input_audio_buffer.speech_started") {
        setStatus("Listening");
      }

      if (event.type === "response.created") {
        setStatus("Thinking");
        setLiveDraft("");
      }

      if (event.type === "response.output_text.delta" && event.delta) {
        setLiveDraft((current) => current + event.delta);
      }

      if (event.type === "response.output_audio_transcript.delta" && event.delta) {
        setLiveDraft((current) => current + event.delta);
      }

      if (event.type === "response.done") {
        const text = extractResponseText(event) || liveDraft;
        if (text) addMessage("assistant", text);
        setLiveDraft("");
        setStatus("Realtime ready");
        handleToolCalls(event);
      }

      if (event.type === "error") {
        setConnectionState("error");
        setStatus(event.error?.message ?? "Realtime error");
      }
    },
    [addMessage, handleToolCalls, liveDraft],
  );

  const startSession = useCallback(async () => {
    if (connectionState === "connecting" || connectionState === "connected") return;

    setConnectionState("connecting");
    setStatus("Requesting short-lived Realtime key");

    try {
      const tokenResponse = await fetch("/api/realtime/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topicId: selectedTopicId }),
      });

      const tokenData = (await tokenResponse.json()) as { value?: string; error?: string; detail?: string };

      if (!tokenResponse.ok || !tokenData.value) {
        throw new Error(tokenData.error ?? tokenData.detail ?? "Realtime token request failed");
      }

      setStatus("Opening microphone");

      const pc = new RTCPeerConnection();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audio = document.createElement("audio");
      audio.autoplay = true;

      pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
      };

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const dataChannel = pc.createDataChannel("oai-events");
      dataChannel.addEventListener("open", () => {
        setConnectionState("connected");
        setStatus("Realtime ready");
        sendEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Start an exam review for ${selectedTopic.name}. Ask me one diagnostic question first.`,
              },
            ],
          },
        });
        sendEvent({
          type: "response.create",
          response: {
            output_modalities: ["text", "audio"],
          },
        });
      });
      dataChannel.addEventListener("message", handleServerEvent);
      dataChannel.addEventListener("close", () => {
        setConnectionState("idle");
        setStatus("Offline");
      });

      pcRef.current = pc;
      dataChannelRef.current = dataChannel;
      mediaStreamRef.current = stream;
      audioRef.current = audio;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${tokenData.value}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(await sdpResponse.text());
      }

      await pc.setRemoteDescription({
        type: "answer",
        sdp: await sdpResponse.text(),
      });

      setStatus("Connecting media");
    } catch (error) {
      stopSession();
      setConnectionState("error");
      setStatus(error instanceof Error ? error.message : "Unable to start Realtime");
    }
  }, [connectionState, handleServerEvent, selectedTopic.name, selectedTopicId, sendEvent, stopSession]);

  const sendText = useCallback(
    (text: string) => {
      const boardSummary = `Whiteboard summary: ${strokeCount} freehand stroke groups. AI diagram: ${
        diagram ? `${diagram.title} with ${diagram.nodes.length} nodes` : "none"
      }.`;

      const sent = sendEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: `${text}\n\nActive topic: ${selectedTopic.name}.\n${boardSummary}`,
            },
          ],
        },
      });

      if (sent) {
        addMessage("user", text);
        sendEvent({
          type: "response.create",
          response: {
            output_modalities: ["text", "audio"],
          },
        });
      }
    },
    [addMessage, diagram, selectedTopic.name, sendEvent, strokeCount],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;

    if (connectionState !== "connected") {
      addMessage(
        "system",
        "Connect Realtime first. The text box uses the same live session so GPT can use the whiteboard tools.",
      );
      return;
    }

    setInput("");
    sendText(value);
  };

  const askAboutBoard = () => {
    if (connectionState !== "connected") {
      addMessage("system", "Connect Realtime first, then I can send the whiteboard state to the tutor.");
      return;
    }

    sendText("Look at the current whiteboard summary and help me improve the diagram or explain what is missing.");
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
            {connectionState === "connected" ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{status}</span>
          </div>
          <button
            className={classNames("primary-button", connectionState === "connected" && "danger-button")}
            onClick={connectionState === "connected" ? stopSession : startSession}
            type="button"
          >
            {connectionState === "connected" ? <MicOff size={16} /> : <Mic size={16} />}
            {connectionState === "connected" ? "Stop voice" : "Start voice"}
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
            gpt-realtime-2
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

      <section className="studio-panel" aria-label="Realtime tutor and whiteboard">
        <div className="tutor-card">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Realtime tutor</p>
              <h2>Voice, text, diagrams</h2>
            </div>
            <span className={classNames("status-dot", connectionState)} />
          </header>

          <div className="message-log" aria-live="polite">
            {messages.map((message) => (
              <div className={`message ${message.role}`} key={message.id}>
                <span>{message.role}</span>
                <p>{message.text}</p>
              </div>
            ))}
            {liveDraft ? (
              <div className="message assistant live">
                <span>assistant</span>
                <p>{liveDraft}</p>
              </div>
            ) : null}
          </div>

          <form className="composer" onSubmit={handleSubmit}>
            <input
              aria-label="Ask LearnSci"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask for a trace, quiz, UML sketch, or exam drill..."
              value={input}
            />
            <button title="Send" type="submit">
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

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const beginStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveStroke({ id: uid("stroke"), points: [pointerPosition(event)] });
  };

  const extendStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
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
          <button title="Pen">
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
        <span>{diagram ? `${diagram.title} diagram` : "No AI diagram yet"}</span>
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
