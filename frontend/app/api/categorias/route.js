import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Categoria from "@/lib/models/Categoria";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();
  const list = await Categoria.find({}).sort({ ordem: 1, nome: 1 }).lean();
  return NextResponse.json(list);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();
  const body = await request.json();

  if (!body.nome?.trim())
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const cat = await Categoria.create({
    nome: body.nome.trim(),
    ordem: body.ordem ?? 0,
    cor: body.cor ?? null,
  });

  return NextResponse.json(cat, { status: 201 });
}
