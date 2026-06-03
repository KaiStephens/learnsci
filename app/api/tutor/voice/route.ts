import { NextResponse } from "next/server";
import {
  getUsageLedger,
  runTutorTurn,
  synthesizeSpeech,
  transcribeAudio,
  type TutorHistoryMessage,
} from "@/lib/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VoiceRequest = {
  topicId?: string;
  audioBase64?: string;
  audioFormat?: string;
  durationMs?: number;
  boardSummary?: string;
  history?: TutorHistoryMessage[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VoiceRequest;

    if (!body.audioBase64 || !body.audioFormat) {
      return NextResponse.json(
        { error: "audioBase64 and audioFormat are required." },
        { status: 400 },
      );
    }

    const transcript = await transcribeAudio({
      audioBase64: body.audioBase64,
      format: body.audioFormat,
      durationMs: body.durationMs,
    });

    if (!transcript) {
      return NextResponse.json(
        { error: "No speech was transcribed. Try again closer to the microphone." },
        { status: 400 },
      );
    }

    const turn = await runTutorTurn({
      topicId: body.topicId ?? "culminating",
      userText: transcript,
      boardSummary: body.boardSummary ?? "No board state supplied.",
      history: body.history ?? [],
    });

    const audio = await synthesizeSpeech(turn.text);

    return NextResponse.json({
      transcript,
      assistant: turn.text,
      toolCalls: turn.toolCalls,
      audio,
      usage: getUsageLedger(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Tutor voice turn failed.",
      },
      { status: 500 },
    );
  }
}
