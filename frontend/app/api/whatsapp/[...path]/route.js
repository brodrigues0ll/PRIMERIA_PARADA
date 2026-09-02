import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const WA_URL = process.env.WA_INTERNAL_URL ?? "http://localhost:3099";
const WA_KEY = process.env.WA_API_KEY ?? "";

async function proxyRequest(request, params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { path } = await params;
  const pathStr = Array.isArray(path) ? path.join("/") : path;
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const url = `${WA_URL}/api/${pathStr}${query}`;

  const init = {
    method: request.method,
    headers: { "x-api-key": WA_KEY, "Content-Type": "application/json" },
  };

  if (request.method === "POST" || request.method === "PATCH") {
    const body = await request.text();
    if (body) init.body = body;
  }

  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";

  if (contentType.startsWith("image/")) {
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: res.status });
}

export const GET = (req, ctx) => proxyRequest(req, ctx.params);
export const POST = (req, ctx) => proxyRequest(req, ctx.params);
export const DELETE = (req, ctx) => proxyRequest(req, ctx.params);
