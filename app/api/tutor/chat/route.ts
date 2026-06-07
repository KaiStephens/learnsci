import { NextResponse } from "next/server";
import {
  runTutorTurn,
  synthesizeSpeech,
  type TutorHistoryMessage,
} from "@/lib/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequest = {
  topicId?: string;
  subjectName?: string;
  curriculumContext?: string;
  message?: string;
  boardSummary?: string;
  history?: TutorHistoryMessage[];
  speak?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const turn = await runTutorTurn({
      topicId: body.topicId ?? "graphics-gui",
      subjectName: body.subjectName,
      curriculumContext: body.curriculumContext,
      userText: message,
      boardSummary: body.boardSummary ?? "No board state supplied.",
      history: body.history ?? [],
    });

    const audio = body.speak === false ? undefined : await synthesizeSpeech(turn.text);

    return NextResponse.json({
      transcript: message,
      assistant: turn.text,
      toolCalls: turn.toolCalls,
      audio,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Tutor chat failed.",
      },
      { status: 500 },
    );
  }
}
