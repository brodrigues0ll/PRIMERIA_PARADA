import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Mesa from "@/lib/models/Mesa";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  await connectDB();

  const { id } = await params;
  const body = await request.json();
  const allowed = ["nome", "capacidade", "ativa", "posicao", "ordem"];
  const update = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (update.nome) update.nome = update.nome.trim();

  const mesa = await Mesa.findByIdAndUpdate(id, update, { new: true });
  if (!mesa) return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 });
  return NextResponse.json({ data: mesa });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  await connectDB();

  const { id } = await params;
  const mesa = await Mesa.findByIdAndUpdate(id, { ativa: false }, { new: true });
  if (!mesa) return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 });
  return NextResponse.json({ data: mesa });
}
