# LearnSci

Minimal ICS4U study workspace with a Realtime voice tutor, sanitized Classroom-derived curriculum map, and an Obsidian-style drawing canvas.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your OpenAI API key to `.env.local`. The browser never receives the standard API key. The app mints a short-lived Realtime client secret through `app/api/realtime/session/route.ts`.

## Realtime

LearnSci uses OpenAI `gpt-realtime-2` through WebRTC. The server route calls `/v1/realtime/client_secrets`; the client connects with the returned ephemeral key and exchanges Realtime events over a data channel.

## Curriculum Privacy

The committed curriculum is a sanitized outline inferred from Classroom topic names, assignment titles, due dates, and broad skills. Private attachments, submissions, and teacher-authored instructions are intentionally not committed. Put any private exported curriculum in `data/*.local.json`, which is ignored by git.
