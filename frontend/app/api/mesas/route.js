import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Mesa from "@/lib/models/Mesa";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();

  const { searchParams } = new URL(request.url);
  const todas = searchParams.get("todas") === "true";
  const filtro = todas ? {} : { ativa: true };

  const mesas = await Mesa.find(filtro).sort({ ordem: 1, createdAt: 1 }).lean();
  return NextResponse.json({ data: mesas });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  await connectDB();

  const { nome, capacidade } = await request.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const count = await Mesa.countDocuments();
  const mesa = await Mesa.create({ nome: nome.trim(), capacidade: capacidade || null, ordem: count });
  return NextResponse.json({ data: mesa }, { status: 201 });
}
