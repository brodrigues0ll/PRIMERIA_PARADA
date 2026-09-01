import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import LocalEstoque from "@/lib/models/LocalEstoque";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const locais = await LocalEstoque.find({ ativo: true }).sort({ ordem: 1, nome: 1 });
  return NextResponse.json({ data: locais });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "admin")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  await connectDB();
  const { nome, tipo, descricao, ordem } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  try {
    const local = await LocalEstoque.create({
      nome: nome.trim(),
      tipo: tipo || "outro",
      descricao: descricao || "",
      ordem: ordem ?? 0,
    });
    return NextResponse.json({ data: local }, { status: 201 });
  } catch (err) {
    if (err.code === 11000)
      return NextResponse.json({ error: "Já existe um local com esse nome" }, { status: 409 });
    return NextResponse.json({ error: "Erro ao criar local" }, { status: 500 });
  }
}
