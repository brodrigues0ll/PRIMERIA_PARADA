import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Mesa from "@/lib/models/Mesa";

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  await connectDB();

  const posicoes = await request.json();
  if (!Array.isArray(posicoes)) return NextResponse.json({ error: "Formato inválido" }, { status: 400 });

  await Promise.all(
    posicoes.map(({ id, x, y, ordem }) =>
      Mesa.findByIdAndUpdate(id, { posicao: { x, y }, ...(ordem !== undefined ? { ordem } : {}) })
    )
  );

  return NextResponse.json({ ok: true });
}
