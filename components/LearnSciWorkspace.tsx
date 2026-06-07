"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Check,
  Download,
  GraduationCap,
  MessageCircle,
  Mic,
  MicOff,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Globe,
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
import { createProgressLog, summarizeEvidence, type ProgressLog } from "@/lib/studyEngine";

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

type CanvasDrawing = Extract<TutorToolCall, { name: "draw_canvas" }>["arguments"];
type CanvasElement = CanvasDrawing["elements"][number];
type CanvasArrow = NonNullable<CanvasDrawing["arrows"]>[number];
type CanvasBounds = {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
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

type StudyProfile = {
  subjectName: string;
  topics: CurriculumTopic[];
  setupComplete: boolean;
};

type LessonPack = {
  id: string;
  name: string;
  description: string;
  topics: CurriculumTopic[];
};

const PROFILE_STORAGE_KEY = "learnsci-study-profile-v1";

const SUBJECT_PACKS: LessonPack[] = [
  {
    id: "ics4u",
    name: "ICS4U Computer Science",
    description: "OOP, Java foundations, arrays, algorithms, recursion, graphics.",
    topics: curriculum,
  },
  {
    id: "math",
    name: "Math Review",
    description: "Functions, algebra, trigonometry, calculus-style reasoning.",
    topics: [
      {
        id: "math-functions",
        name: "Functions and Graphs",
        accent: "#8fd8ff",
        objective: "Review domain, range, transformations, and graph interpretation.",
        examWeight: "Core",
        checkpoints: ["Identify domain and range.", "Explain transformations.", "Sketch from an equation."],
        items: [
          {
            title: "Graph Transformations",
            type: "material",
            date: "Jun 7",
            status: "reference",
            skills: ["functions", "graphs", "transformations"],
            reviewPrompt: "Teach graph transformations with a clear before-and-after visual.",
          },
          {
            title: "Domain and Range",
            type: "checkpoint",
            date: "Jun 7",
            status: "reference",
            skills: ["domain", "range", "interval notation"],
            reviewPrompt: "Quiz me on finding domain and range from graphs and equations.",
          },
        ],
      },
      {
        id: "math-trig",
        name: "Trigonometry",
        accent: "#ffd89b",
        objective: "Connect ratios, unit-circle thinking, identities, and graph behavior.",
        examWeight: "High",
        checkpoints: ["Use SOH CAH TOA.", "Read unit-circle values.", "Explain sine/cosine graphs."],
        items: [
          {
            title: "Unit Circle Basics",
            type: "material",
            date: "Jun 7",
            status: "reference",
            skills: ["unit circle", "angles", "ratios"],
            reviewPrompt: "Draw the unit circle basics and explain the key coordinates.",
          },
        ],
      },
    ],
  },
  {
    id: "science",
    name: "Science Review",
    description: "Concept maps, lab reasoning, systems, formulas, and diagrams.",
    topics: [
      {
        id: "science-systems",
        name: "Systems and Models",
        accent: "#9be7c0",
        objective: "Explain inputs, outputs, variables, and cause-effect relationships.",
        examWeight: "Core",
        checkpoints: ["Define the system boundary.", "Track variables.", "Use diagrams to explain change."],
        items: [
          {
            title: "Cause and Effect Diagrams",
            type: "material",
            date: "Jun 7",
            status: "reference",
            skills: ["systems", "variables", "diagrams"],
            reviewPrompt: "Draw a cause-and-effect model and quiz me on the variables.",
          },
        ],
      },
    ],
  },
  {
    id: "humanities",
    name: "Humanities Review",
    description: "Timelines, evidence, thesis structure, comparison, and analysis.",
    topics: [
      {
        id: "humanities-evidence",
        name: "Evidence and Analysis",
        accent: "#c8b6ff",
        objective: "Build arguments using claims, evidence, reasoning, and counterpoints.",
        examWeight: "Core",
        checkpoints: ["Write a claim.", "Choose evidence.", "Explain why it proves the point."],
        items: [
          {
            title: "Claim Evidence Reasoning",
            type: "material",
            date: "Jun 7",
            status: "reference",
            skills: ["claim", "evidence", "reasoning"],
            reviewPrompt: "Teach claim-evidence-reasoning with a simple argument map.",
          },
        ],
      },
    ],
  },
];

function fallbackProfile(): StudyProfile {
  return {
    subjectName: SUBJECT_PACKS[0].name,
    topics: SUBJECT_PACKS[0].topics,
    setupComplete: false,
  };
}

function readStoredProfile(): StudyProfile | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) return undefined;
    const parsed = JSON.parse(stored) as StudyProfile;
    return parsed.topics?.length ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function initialProfile() {
  return readStoredProfile() ?? fallbackProfile();
}

function initialSetupVisible() {
  return !(readStoredProfile()?.setupComplete ?? false);
}

function initialTopicId() {
  return initialProfile().topics[0]?.id ?? "graphics-gui";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom";
}

function parseCustomLessons(subjectName: string, raw: string): CurriculumTopic[] {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return SUBJECT_PACKS[0].topics;
  }

  return [
    {
      id: `custom-${slugify(subjectName)}`,
      name: subjectName || "Custom Study",
      accent: "#96e6bc",
      objective: `Review ${subjectName || "this subject"} with visual explanations and practice questions.`,
      examWeight: "Core",
      checkpoints: ["Explain the key idea.", "Draw the concept.", "Answer one practice question."],
      items: lines.map((line, index) => {
        const [rawTitle, rawUrl] = line.split("|").map((part) => part.trim());
        const title = rawTitle.replace(/^[-*]\s*/, "");
        const url = rawUrl?.startsWith("http") ? rawUrl : undefined;

        return {
          title,
          type: index === 0 ? "checkpoint" : "material",
          date: "Custom",
          status: "reference",
          skills: ["custom lesson", subjectName || "study"],
          reviewPrompt: `Teach ${title} with a clear example, then ask one check-for-understanding question.`,
          resources: url
            ? [
                {
                  title: `${title} resource`,
                  url,
                  kind: url.includes("youtube.com") || url.includes("youtu.be") ? "video" : "website",
                },
              ]
            : undefined,
        };
      }),
    },
  ];
}

function serializeCurriculum(topics: CurriculumTopic[]) {
  return topics
    .map((topic) => {
      const lessons = topic.items
        .map((item) => {
          const resources = item.resources?.length
            ? ` Resources: ${item.resources.map((resource) => `${resource.title} (${resource.url})`).join(", ")}`
            : "";
          return `${item.title}.${resources}`;
        })
        .join("; ");
      return `${topic.name}: ${topic.objective}. Lessons: ${lessons}.`;
    })
    .join("\n");
}

function evidenceDrawing(log: ProgressLog): CanvasDrawing {
  const lines = summarizeEvidence(log);

  return {
    title: "LearnSci Rubric Evidence",
    elements: [
      {
        id: "oop",
        type: "box",
        x: 0,
        y: 0,
        w: 300,
        h: 116,
        text: "OOP classes\nStudyNode -> LessonNode\nStudyDeck constructor",
        color: "violet",
        size: "m",
      },
      {
        id: "grid",
        type: "box",
        x: 390,
        y: 0,
        w: 300,
        h: 116,
        text: `2D array/data structure\n${lines[1]}`,
        color: "green",
        size: "m",
      },
      {
        id: "sort",
        type: "box",
        x: 0,
        y: 190,
        w: 300,
        h: 116,
        text: "Sort algorithm\nselectionSortByDifficulty()",
        color: "orange",
        size: "m",
      },
      {
        id: "search",
        type: "box",
        x: 390,
        y: 190,
        w: 300,
        h: 116,
        text: `Search algorithm\nbinarySearchByTitle()\n${lines[3]}`,
        color: "blue",
        size: "m",
      },
      {
        id: "recursion",
        type: "box",
        x: 0,
        y: 380,
        w: 300,
        h: 116,
        text: `Recursion\nrecursivePrerequisitePath()\n${lines[4]}`,
        color: "red",
        size: "m",
      },
      {
        id: "fileio",
        type: "box",
        x: 390,
        y: 380,
        w: 300,
        h: 116,
        text: "File input/output\nExport and import progress log JSON",
        color: "yellow",
        size: "m",
      },
    ],
    arrows: [
      { from: "oop", to: "grid", label: "builds lessons", color: "violet" },
      { from: "grid", to: "sort", label: "feeds", color: "green" },
      { from: "sort", to: "search", label: "orders", color: "orange" },
      { from: "search", to: "recursion", label: "drills", color: "blue" },
      { from: "recursion", to: "fileio", label: "logged", color: "red" },
    ],
  };
}

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

function colorForCanvas(color?: CanvasElement["color"] | CanvasArrow["color"]): TLGeoShape["props"]["color"] {
  if (color === "violet") return "violet";
  if (color === "orange") return "orange";
  if (color === "green") return "green";
  if (color === "red") return "red";
  if (color === "yellow") return "yellow";
  if (color === "black") return "black";
  return "blue";
}

function sizeForCanvas(size?: CanvasElement["size"]): TLGeoShape["props"]["size"] {
  if (size === "s" || size === "l" || size === "xl") return size;
  return "m";
}

function normalizeCanvasText(text: string) {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function estimateElementSize(element: CanvasElement) {
  const text = normalizeCanvasText(element.text);
  const lines = text.split("\n");
  const lineCount = Math.max(1, lines.length);
  const longestLine = Math.max(...lines.map((line) => line.length), 8);
  const sizeFactor = element.size === "xl" ? 20 : element.size === "l" ? 17 : element.size === "s" ? 11 : 14;
  const minWidth = element.type === "code" ? 440 : element.type === "text" ? 220 : 250;
  const minHeight = element.type === "text" ? 58 : 96;

  return {
    w: Math.max(element.w ?? 0, minWidth, longestLine * sizeFactor + 48),
    h: Math.max(element.h ?? 0, minHeight, lineCount * 34 + 48),
  };
}

function elementGeometry(type: CanvasElement["type"]): TLGeoShape["props"]["geo"] {
  if (type === "ellipse") return "ellipse";
  if (type === "diamond") return "diamond";
  return "rectangle";
}

function canvasElementBounds(element: CanvasElement): CanvasBounds {
  const { w, h } = estimateElementSize(element);
  return {
    x: element.x,
    y: element.y,
    w,
    h,
    cx: element.x + w / 2,
    cy: element.y + h / 2,
  };
}

function boundsFromRect(x: number, y: number, w: number, h: number): CanvasBounds {
  return {
    x,
    y,
    w,
    h,
    cx: x + w / 2,
    cy: y + h / 2,
  };
}

function rectsOverlap(a: CanvasBounds, b: CanvasBounds, padding = 0) {
  return !(
    a.x + a.w + padding <= b.x ||
    b.x + b.w + padding <= a.x ||
    a.y + a.h + padding <= b.y ||
    b.y + b.h + padding <= a.y
  );
}

function intersectionArea(a: CanvasBounds, b: CanvasBounds, padding = 0) {
  const overlapW = Math.max(
    0,
    Math.min(a.x + a.w + padding, b.x + b.w + padding) - Math.max(a.x - padding, b.x - padding),
  );
  const overlapH = Math.max(
    0,
    Math.min(a.y + a.h + padding, b.y + b.h + padding) - Math.max(a.y - padding, b.y - padding),
  );
  return overlapW * overlapH;
}

function shiftedBounds(bounds: CanvasBounds, dx: number, dy: number): CanvasBounds {
  return boundsFromRect(bounds.x + dx, bounds.y + dy, bounds.w, bounds.h);
}

function resolveElementOverlaps(boundsById: Map<string, CanvasBounds>) {
  const entries = [...boundsById.entries()].sort(([, a], [, b]) => a.y - b.y || a.x - b.x);
  const padding = 18;

  for (let pass = 0; pass < 18; pass += 1) {
    let changed = false;

    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const [, a] = entries[i];
        const [idB, b] = entries[j];
        if (!rectsOverlap(a, b, 0)) continue;

        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        const moveRight = b.cx >= a.cx ? 1 : -1;
        const moveDown = b.cy >= a.cy ? 1 : -1;
        const dx = overlapX <= overlapY ? moveRight * (overlapX + padding) : 0;
        const dy = overlapY < overlapX ? moveDown * (overlapY + padding) : 0;
        const next = shiftedBounds(b, dx, dy);

        entries[j][1] = next;
        boundsById.set(idB, next);
        changed = true;
      }
    }

    if (!changed) break;
  }
}

function connectionPoint(element: CanvasBounds, target: { x: number; y: number }) {
  const dx = target.x - element.cx;
  const dy = target.y - element.cy;

  if (Math.abs(dx) * element.h > Math.abs(dy) * element.w) {
    return {
      x: element.cx + Math.sign(dx || 1) * (element.w / 2 + 8),
      y: element.cy + dy * ((element.w / 2 + 8) / Math.max(Math.abs(dx), 1)),
    };
  }

  return {
    x: element.cx + dx * ((element.h / 2 + 8) / Math.max(Math.abs(dy), 1)),
    y: element.cy + Math.sign(dy || 1) * (element.h / 2 + 8),
  };
}

function zoomToGeneratedBounds(editor: Editor, bounds: Box) {
  editor.zoomToBounds(new Box(bounds.x - 380, bounds.y - 120, bounds.w + 520, bounds.h + 240), {
    inset: 80,
    targetZoom: 1,
    animation: { duration: 260 },
  });
}

function arrowLabelBounds(text: string, x: number, y: number) {
  const normalized = normalizeCanvasText(text);
  const longestLine = Math.max(...normalized.split("\n").map((line) => line.length), 8);
  const w = Math.max(96, Math.min(260, longestLine * 13 + 30));
  const h = Math.max(42, normalized.split("\n").length * 30 + 16);
  return boundsFromRect(x - w / 2, y - h / 2, w, h);
}

function labelOverlapScore(bounds: CanvasBounds, occupied: CanvasBounds[]) {
  return occupied.reduce((score, item) => score + intersectionArea(bounds, item, 14), 0);
}

function placeArrowLabel(
  text: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
  occupied: CanvasBounds[],
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const normal = { x: -dy / length, y: dx / length };
  const along = { x: dx / length, y: dy / length };
  const candidates: CanvasBounds[] = [];

  for (const t of [0.5, 0.35, 0.65, 0.2, 0.8]) {
    for (const offset of [54, -54, 88, -88, 124, -124]) {
      const baseX = start.x + dx * t;
      const baseY = start.y + dy * t;
      candidates.push(
        arrowLabelBounds(
          text,
          baseX + normal.x * offset + along.x * 12,
          baseY + normal.y * offset + along.y * 12,
        ),
      );
    }
  }

  return candidates.find((candidate) => labelOverlapScore(candidate, occupied) === 0)
    ?? candidates.sort((a, b) => labelOverlapScore(a, occupied) - labelOverlapScore(b, occupied))[0]
    ?? arrowLabelBounds(text, (start.x + end.x) / 2, (start.y + end.y) / 2);
}

function drawCanvasOnTldraw(editor: Editor, drawing: CanvasDrawing) {
  const elementBounds = new Map<string, CanvasBounds>();
  drawing.elements.forEach((element) => {
    elementBounds.set(element.id, canvasElementBounds(element));
  });
  resolveElementOverlaps(elementBounds);

  const arrowShapes: TLCreateShapePartial<TLShape>[] = [];
  const nodeShapes: TLCreateShapePartial<TLShape>[] = [];
  const labelShapes: TLCreateShapePartial<TLShape>[] = [];
  const allBounds: Box[] = [];
  const occupiedBounds: CanvasBounds[] = [...elementBounds.values()];

  if (drawing.title) {
    const titleShape = {
      id: createShapeId(`canvas-title-${Date.now()}`),
      type: "text",
      x: 0,
      y: -120,
      props: {
        richText: toRichText(drawing.title),
        autoSize: false,
        w: 760,
        size: "xl",
        color: "blue",
        font: "sans",
      },
    } satisfies TLCreateShapePartial<TLTextShape>;
    nodeShapes.push(titleShape);
    allBounds.push(new Box(0, -120, 760, 72));
  }

  for (const arrow of drawing.arrows ?? []) {
    const fromElement = arrow.from ? elementBounds.get(arrow.from) : undefined;
    const toElement = arrow.to ? elementBounds.get(arrow.to) : undefined;
    const rawStart = arrow.start ?? (fromElement ? { x: fromElement.cx, y: fromElement.cy } : undefined);
    const rawEnd = arrow.end ?? (toElement ? { x: toElement.cx, y: toElement.cy } : undefined);

    if (!rawStart || !rawEnd) continue;

    const start = fromElement ? connectionPoint(fromElement, rawEnd) : rawStart;
    const end = toElement ? connectionPoint(toElement, start) : rawEnd;
    const color = colorForCanvas(arrow.color);

    arrowShapes.push({
      id: createShapeId(`canvas-arrow-${Date.now()}-${arrowShapes.length}`),
      type: "arrow",
      x: start.x,
      y: start.y,
      props: {
        start: { x: 0, y: 0 },
        end: { x: end.x - start.x, y: end.y - start.y },
        richText: toRichText(""),
        color,
        labelColor: "black",
        size: "m",
        dash: "draw",
        arrowheadEnd: "arrow",
        kind: "arc",
      },
    } satisfies TLCreateShapePartial<TLArrowShape>);

    allBounds.push(
      new Box(
        Math.min(start.x, end.x),
        Math.min(start.y, end.y),
        Math.max(Math.abs(end.x - start.x), 1),
        Math.max(Math.abs(end.y - start.y), 1),
      ),
    );

    if (arrow.label) {
      const labelBounds = placeArrowLabel(arrow.label, start, end, occupiedBounds);
      occupiedBounds.push(labelBounds);

      labelShapes.push({
        id: createShapeId(`canvas-label-${Date.now()}-${labelShapes.length}`),
        type: "text",
        x: labelBounds.x,
        y: labelBounds.y,
        props: {
          richText: toRichText(normalizeCanvasText(arrow.label)),
          autoSize: false,
          w: labelBounds.w,
          size: "m",
          color,
          font: "draw",
        },
      } satisfies TLCreateShapePartial<TLTextShape>);
      allBounds.push(new Box(labelBounds.x, labelBounds.y, labelBounds.w, labelBounds.h));
    }
  }

  for (const element of drawing.elements) {
    const bounds = elementBounds.get(element.id);
    if (!bounds) continue;

    const color = colorForCanvas(element.color);

    if (element.type === "text") {
      nodeShapes.push({
        id: createShapeId(`canvas-text-${element.id}-${Date.now()}`),
        type: "text",
        x: bounds.x,
        y: bounds.y,
        props: {
          richText: toRichText(normalizeCanvasText(element.text)),
          autoSize: false,
          w: bounds.w,
          size: sizeForCanvas(element.size),
          color,
          font: "sans",
        },
      } satisfies TLCreateShapePartial<TLTextShape>);
    } else {
      nodeShapes.push({
        id: createShapeId(`canvas-node-${element.id}-${Date.now()}`),
        type: "geo",
        x: bounds.x,
        y: bounds.y,
        props: {
          geo: elementGeometry(element.type),
          w: bounds.w,
          h: bounds.h,
          richText: toRichText(normalizeCanvasText(element.text)),
          color,
          labelColor: "black",
          fill: element.type === "code" ? "none" : "semi",
          dash: element.type === "code" ? "dashed" : "solid",
          size: sizeForCanvas(element.size),
          font: element.type === "code" ? "mono" : "sans",
          align: "middle",
          verticalAlign: "middle",
        },
      } satisfies TLCreateShapePartial<TLGeoShape>);
    }

    allBounds.push(new Box(bounds.x, bounds.y, bounds.w, bounds.h));
  }

  const shapes = [...arrowShapes, ...nodeShapes, ...labelShapes];
  const shapeIds = shapes.map((shape) => shape.id).filter((id): id is TLShapeId => Boolean(id));
  const bounds =
    allBounds.length > 1
      ? Box.Common(allBounds)
      : allBounds[0] ?? new Box(0, 0, 760, 420);

  editor.run(() => {
    editor.createShapes(shapes);
    editor.select(...shapeIds);
    zoomToGeneratedBounds(editor, bounds);
  });
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
    zoomToGeneratedBounds(editor, bounds);
  });
}

export function LearnSciWorkspace() {
  const [studyProfile, setStudyProfile] = useState<StudyProfile>(() => initialProfile());
  const [showSetup, setShowSetup] = useState(() => initialSetupVisible());
  const [setupPackId, setSetupPackId] = useState(SUBJECT_PACKS[0].id);
  const [customSubject, setCustomSubject] = useState("");
  const [customLessons, setCustomLessons] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState(() => initialTopicId());
  const [expandedTopicId, setExpandedTopicId] = useState(() => initialTopicId());
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeCurriculum = studyProfile.topics.length ? studyProfile.topics : curriculum;
  const selectedTopic = useMemo(
    () => activeCurriculum.find((topic) => topic.id === selectedTopicId) ?? activeCurriculum[0] ?? getTopic(selectedTopicId),
    [activeCurriculum, selectedTopicId],
  );
  const selectedLesson = selectedTopic.items[selectedLessonIndex] ?? selectedTopic.items[0];
  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const progressPreview = useMemo(
    () => createProgressLog(activeCurriculum, "LearnSci progress preview"),
    [activeCurriculum],
  );
  const evidenceSummary = useMemo(() => summarizeEvidence(progressPreview), [progressPreview]);

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
      `subject ${studyProfile.subjectName}`,
      `topic ${selectedTopic.name}`,
      `lesson ${selectedLesson.title}`,
    ].join("; ");
  }, [canvasStats.summary, selectedLesson.title, selectedTopic.name, studyProfile.subjectName]);

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
        if (toolCall.name === "draw_canvas") {
          const editor = editorRef.current;
          if (editor) {
            drawCanvasOnTldraw(editor, toolCall.arguments);
            updateCanvasStats(editor);
          }
        }

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
            subjectName: studyProfile.subjectName,
            curriculumContext: serializeCurriculum(activeCurriculum),
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
    [activeCurriculum, addMessage, boardSummary, handleTutorResponse, messages, selectedTopicId, studyProfile.subjectName],
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

  const applyStudySetup = () => {
    const selectedPack = SUBJECT_PACKS.find((pack) => pack.id === setupPackId) ?? SUBJECT_PACKS[0];
    const nextProfile =
      setupPackId === "custom"
        ? {
            subjectName: customSubject.trim() || "Custom Study",
            topics: parseCustomLessons(customSubject.trim() || "Custom Study", customLessons),
            setupComplete: true,
          }
        : {
            subjectName: selectedPack.name,
            topics: selectedPack.topics,
            setupComplete: true,
          };

    setStudyProfile(nextProfile);
    setSelectedTopicId(nextProfile.topics[0].id);
    setExpandedTopicId(nextProfile.topics[0].id);
    setSelectedLessonIndex(0);
    setShowSetup(false);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    addMessage("system", `${nextProfile.subjectName} loaded.`);
  };

  const resetStudySetup = () => {
    setSetupPackId(SUBJECT_PACKS[0].id);
    setCustomSubject("");
    setCustomLessons("");
    setShowSetup(true);
  };

  const drawRubricEvidence = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const log = createProgressLog(activeCurriculum, boardSummary());
    drawCanvasOnTldraw(editor, evidenceDrawing(log));
    updateCanvasStats(editor);
    addMessage("system", "Rubric evidence diagram added to the board.");
  };

  const exportProgressLog = () => {
    const log = createProgressLog(activeCurriculum, boardSummary());
    const blob = new Blob([JSON.stringify(log, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `learnsci-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addMessage("system", "Progress log exported as JSON.");
  };

  const importProgressLog = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const log = JSON.parse(String(reader.result ?? "")) as ProgressLog;
        addMessage(
          "system",
          `Imported ${log.evidence?.length ?? 0} evidence items from ${file.name}.`,
        );
      } catch {
        addMessage("system", `Could not read ${file.name} as a LearnSci progress log.`);
      }
    };
    reader.readAsText(file);
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
      {showSetup ? (
        <section className="setup-shell" aria-label="Study setup" role="dialog">
          <div className="setup-card">
            <div className="setup-head">
              <span>
                <Sparkles size={16} aria-hidden="true" />
                First boot
              </span>
              <button
                aria-label="Close setup"
                onClick={() => setShowSetup(false)}
                type="button"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <h2>Choose what LearnSci should teach.</h2>
            <p>
              Start with Computer Science or adapt the same canvas tutor to another subject.
            </p>

            <div className="setup-packs" aria-label="Lesson packs">
              {SUBJECT_PACKS.map((pack) => (
                <button
                  className={classNames("setup-pack", setupPackId === pack.id && "active")}
                  key={pack.id}
                  onClick={() => setSetupPackId(pack.id)}
                  type="button"
                >
                  <span>{pack.name}</span>
                  <small>{pack.description}</small>
                  {setupPackId === pack.id ? <Check size={15} aria-hidden="true" /> : null}
                </button>
              ))}
              <button
                className={classNames("setup-pack", setupPackId === "custom" && "active")}
                onClick={() => setSetupPackId("custom")}
                type="button"
              >
                <span>Custom Subject</span>
                <small>Paste any lessons, one per line.</small>
                {setupPackId === "custom" ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
              </button>
            </div>

            {setupPackId === "custom" ? (
              <div className="custom-setup">
                <input
                  aria-label="Custom subject name"
                  onChange={(event) => setCustomSubject(event.target.value)}
                  placeholder="Subject name..."
                  value={customSubject}
                />
                <textarea
                  aria-label="Custom lessons"
                  onChange={(event) => setCustomLessons(event.target.value)}
                  placeholder={"Paste lessons, one per line...\nPhotosynthesis | https://example.com/video\nCellular respiration\nEnergy transfer"}
                  value={customLessons}
                />
              </div>
            ) : null}

            <button className="setup-primary" onClick={applyStudySetup} type="button">
              Start studying
            </button>
          </div>
        </section>
      ) : null}

      <aside className="lesson-rail" aria-label="Lessons">
        <div className="rail-scroll">
          <div className="rail-brand">
            <div className="rail-mark">
              <GraduationCap size={18} aria-hidden="true" />
            </div>
            <div>
              <h1>LearnSci</h1>
              <span>{studyProfile.subjectName}</span>
            </div>
            <button
              aria-label="Change study setup"
              className="setup-reset"
              onClick={resetStudySetup}
              title="Change study setup"
              type="button"
            >
              <Settings size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="rail-section">
            <span className="rail-label">Topics</span>
            <nav className="unit-accordion" aria-label="Study topics">
              {activeCurriculum.map((topic) => {
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
            {selectedLesson.resources?.length ? (
              <div className="resource-list" aria-label="Lesson resources">
                {selectedLesson.resources.map((resource) => (
                  <a href={resource.url} key={resource.url} rel="noreferrer" target="_blank">
                    <Globe size={13} aria-hidden="true" />
                    <span>{resource.title}</span>
                  </a>
                ))}
              </div>
            ) : null}
            <button
              className="start-lesson"
              disabled={sessionState === "thinking"}
              onClick={() => sendPrompt(initialPrompt(selectedTopic, selectedLesson))}
              type="button"
            >
              Start lesson
            </button>
          </section>

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

          <section className="evidence-panel" aria-label="Rubric evidence">
            <span className="rail-label">Rubric Proof</span>
            <div className="evidence-grid">
              {["OOP", "2D array", "sort", "search", "recursion", "file I/O"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <p>{evidenceSummary.join(" / ")}</p>
            <div className="evidence-actions">
              <button onClick={drawRubricEvidence} type="button">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>Draw proof</span>
              </button>
              <button onClick={exportProgressLog} type="button">
                <Download size={14} aria-hidden="true" />
                <span>Export</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} type="button">
                <Upload size={14} aria-hidden="true" />
                <span>Import</span>
              </button>
            </div>
            <input
              accept="application/json"
              className="file-input"
              onChange={(event) => {
                importProgressLog(event.target.files?.[0]);
                event.target.value = "";
              }}
              ref={fileInputRef}
              type="file"
            />
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
