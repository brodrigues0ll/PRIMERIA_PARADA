import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const WA_URL = process.env.WA_INTERNAL_URL ?? "http://localhost:3099";
const WA_KEY = process.env.WA_API_KEY ?? "";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response(null, { status: 401 });

  const upstream = await fetch(`${WA_URL}/api/events`, {
    headers: { "x-api-key": WA_KEY },
    signal: request.signal,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  const transform = new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const eventLine = part.split("\n").find((l) => l.startsWith("event: "));
        const dataLine  = part.split("\n").find((l) => l.startsWith("data: "));
        const event = eventLine?.slice(7);
        if (event === "message" && dataLine) {
          try {
            const msg = JSON.parse(dataLine.slice(6));
            console.log(`[sse] msg fromMe=${msg.fromMe} type=${msg.type} text="${(msg.text || "").slice(0, 50)}"`);
          } catch {}
        }
        controller.enqueue(encoder.encode(part + "\n\n"));
      }
    },
    flush(controller) {
      if (buffer) controller.enqueue(encoder.encode(buffer));
    },
  });

  upstream.body.pipeTo(transform.writable).catch(() => {});

  return new Response(transform.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
