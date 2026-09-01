import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import MembroFamiliar from "@/lib/models/MembroFamiliar";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const membros = await MembroFamiliar.find({ ativo: true }).sort({ nome: 1 }).lean();

  return NextResponse.json({ data: membros });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const body = await request.json();
  const { nome } = body;

  if (!nome || !nome.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const membro = await MembroFamiliar.create({ nome: nome.trim() });

  return NextResponse.json({ data: membro }, { status: 201 });
}
