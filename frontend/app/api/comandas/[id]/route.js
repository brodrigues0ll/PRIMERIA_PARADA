import { NextResponse } from "next/server";
import { requirePermission, getAuthSession } from "@/lib/auth";
import { auditLog, ACOES } from "@/lib/audit";
import connectDB from "@/lib/mongodb";
import { Comanda, Pedido, CaixaDiario, LancamentoFinanceiro } from "@/lib/models";

export async function GET(request, { params }) {
  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;
  await connectDB();

  const comanda = await Comanda.findById(id);
  if (!comanda) return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });

  const pedidos = await Pedido.find({ comanda: id }).populate("menuItem", "nome preco");
  return NextResponse.json({ data: { ...comanda.toObject(), pedidos } });
}

export async function PATCH(request, { params }) {
  const { session, error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (!["fechar", "reabrir", "pagantes", "pagantesPagos"].includes(action)) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  await connectDB();

  if (action === "fechar") {
    const { forma_pagamento } = body;

    if (!forma_pagamento) {
      return NextResponse.json(
        { error: "Forma de pagamento é obrigatória para fechar a comanda" },
        { status: 400 }
      );
    }

    // Verifica caixa aberto
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const caixa = await CaixaDiario.findOne({
      data: { $gte: startOfDay, $lte: endOfDay },
      status: "aberto",
    }).lean();

    if (!caixa) {
      return NextResponse.json(
        { error: "Nenhum caixa aberto hoje. Abra o caixa antes de fechar a comanda." },
        { status: 400 }
      );
    }

    // Calcula total
    const pedidos = await Pedido.find({ comanda: id }).lean();
    const total = pedidos.reduce((acc, p) => acc + (p.preco ?? 0) * (p.quantidade ?? 1), 0);

    // Fecha a comanda
    const comanda = await Comanda.findByIdAndUpdate(
      id,
      {
        status: "fechada",
        fechadaEm: new Date(),
        fechadaPor: session.user.id,
        totalFechamento: total,
        formaPagamentoFechamento: forma_pagamento,
      },
      { new: true }
    );

    if (!comanda) return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });

    // Lançamento automático
    await LancamentoFinanceiro.create({
      caixa: caixa._id,
      tipo: "entrada",
      categoria: "Vendas salão",
      valor: total,
      descricao: `Comanda: ${comanda.nome}`,
      forma_pagamento,
      criadoPor: session.user.id,
      origem: "comanda",
      referencia: comanda._id.toString(),
    });

    await auditLog(session, ACOES.COMANDA_FECHAR, "Comanda", id, {
      nome: comanda.nome,
      total,
      forma_pagamento,
    });

    return NextResponse.json({ data: comanda });
  }

  if (action === "reabrir") {
    const comanda = await Comanda.findByIdAndUpdate(
      id,
      { status: "aberta", fechadaEm: null },
      { new: true }
    );
    if (!comanda) return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });

    await auditLog(session, ACOES.COMANDA_REABRIR, "Comanda", id, { nome: comanda.nome });
    return NextResponse.json({ data: comanda });
  }

  if (action === "pagantes") {
    const comanda = await Comanda.findByIdAndUpdate(
      id,
      { pagantes: body.pagantes ?? [] },
      { new: true }
    );
    if (!comanda) return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
    return NextResponse.json({ data: comanda });
  }

  if (action === "pagantesPagos") {
    const comanda = await Comanda.findByIdAndUpdate(
      id,
      { pagantesPagos: body.pagantesPagos ?? [] },
      { new: true }
    );
    if (!comanda) return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
    return NextResponse.json({ data: comanda });
  }
}
