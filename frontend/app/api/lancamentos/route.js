import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import LancamentoFinanceiro from "@/lib/models/LancamentoFinanceiro";
import CaixaDiario from "@/lib/models/CaixaDiario";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const caixaId = searchParams.get("caixaId");

  if (!caixaId) {
    return NextResponse.json({ error: "caixaId é obrigatório" }, { status: 400 });
  }

  await connectDB();

  const lancamentos = await LancamentoFinanceiro.find({ caixa: caixaId })
    .sort({ data: -1 })
    .lean();

  return NextResponse.json({ data: lancamentos });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const body = await request.json();
  const {
    caixaId,
    tipo,
    categoria,
    valor,
    descricao,
    data,
    forma_pagamento,
    membro_familiar,
  } = body;

  if (!caixaId) {
    return NextResponse.json({ error: "caixaId é obrigatório" }, { status: 400 });
  }

  const caixa = await CaixaDiario.findById(caixaId).lean();
  if (!caixa) {
    return NextResponse.json({ error: "Caixa não encontrado" }, { status: 404 });
  }

  if (caixa.status !== "aberto") {
    return NextResponse.json(
      { error: "Caixa está fechado. Não é possível adicionar lançamentos." },
      { status: 400 }
    );
  }

  if (!tipo || !["entrada", "saida"].includes(tipo)) {
    return NextResponse.json(
      { error: "Tipo deve ser 'entrada' ou 'saida'" },
      { status: 400 }
    );
  }

  if (!categoria) {
    return NextResponse.json({ error: "Categoria é obrigatória" }, { status: 400 });
  }

  if (valor === undefined || valor === null || Number(valor) < 0) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  const lancamento = await LancamentoFinanceiro.create({
    caixa: caixaId,
    tipo,
    categoria,
    valor: Number(valor),
    descricao: descricao || "",
    data: data ? new Date(data) : new Date(),
    forma_pagamento: forma_pagamento || null,
    membro_familiar: membro_familiar || null,
  });

  return NextResponse.json({ data: lancamento }, { status: 201 });
}
