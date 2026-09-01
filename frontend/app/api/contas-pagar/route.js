import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import ContaAPagar from "@/lib/models/ContaAPagar";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pendente";

  const filtro = {};
  if (status !== "todos") {
    filtro.status = status;
  }

  const contas = await ContaAPagar.find(filtro)
    .sort({ vencimento: 1 })
    .lean();

  return NextResponse.json({ data: contas });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const body = await request.json();
  const { descricao, valor, vencimento, categoria, observacoes } = body;

  if (!descricao) {
    return NextResponse.json({ error: "Descrição é obrigatória" }, { status: 400 });
  }

  if (valor === undefined || valor === null || Number(valor) < 0) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  if (!vencimento) {
    return NextResponse.json({ error: "Vencimento é obrigatório" }, { status: 400 });
  }

  if (!categoria) {
    return NextResponse.json({ error: "Categoria é obrigatória" }, { status: 400 });
  }

  const conta = await ContaAPagar.create({
    descricao,
    valor: Number(valor),
    vencimento: new Date(vencimento),
    categoria,
    observacoes: observacoes || "",
  });

  return NextResponse.json({ data: conta }, { status: 201 });
}
