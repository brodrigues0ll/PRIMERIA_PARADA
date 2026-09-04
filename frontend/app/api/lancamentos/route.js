import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import LancamentoFinanceiro from "@/lib/models/LancamentoFinanceiro";
import CaixaDiario from "@/lib/models/CaixaDiario";

export async function GET(request) {
  const { session, error } = await requirePermission("financeiro");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const caixaId = searchParams.get("caixaId");

  if (!caixaId) {
    return NextResponse.json({ error: "caixaId é obrigatório" }, { status: 400 });
  }

  await connectDB();

  const lancamentos = await LancamentoFinanceiro.find({ caixa: caixaId })
    .populate("criadoPor", "nome")
    .sort({ data: -1 })
    .lean();

  return NextResponse.json({ data: lancamentos });
}

export async function POST(request) {
  const { session, error } = await requirePermission("financeiro");
  if (error) return error;

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
    referencia,
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
    referencia: referencia || null,
    criadoPor: session.user.id,
  });

  return NextResponse.json({ data: lancamento }, { status: 201 });
}
