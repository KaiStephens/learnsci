import { NextResponse } from "next/server";
import { buildRealtimeInstructions, realtimeModel, realtimeTools } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionRequest = {
  topicId?: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not configured. Add it to .env.local before starting a realtime session.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as SessionRequest;

  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": "learnsci-local-student",
    },
    body: JSON.stringify({
      expires_after: {
        anchor: "created_at",
        seconds: 600,
      },
      session: {
        type: "realtime",
        model: realtimeModel,
        output_modalities: ["audio", "text"],
        instructions: buildRealtimeInstructions(body.topicId),
        reasoning: {
          effort: "low",
        },
        audio: {
          input: {
            turn_detection: {
              type: "semantic_vad",
            },
          },
          output: {
            voice: "marin",
          },
        },
        tools: realtimeTools,
        tool_choice: "auto",
      },
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "OpenAI Realtime session creation failed.",
        detail: responseText,
      },
      { status: response.status },
    );
  }

  return new NextResponse(responseText, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
