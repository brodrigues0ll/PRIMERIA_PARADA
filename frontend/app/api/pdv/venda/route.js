import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { CaixaDiario, LancamentoFinanceiro, Produto, LocalEstoque, EstoqueLocal } from "@/lib/models";

export async function POST(request) {
  const { session, error } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { itens, forma_pagamento } = body;

  if (!itens?.length) return NextResponse.json({ error: "Nenhum item informado" }, { status: 400 });
  if (!forma_pagamento) return NextResponse.json({ error: "Forma de pagamento é obrigatória" }, { status: 400 });

  await connectDB();

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
      { error: "Nenhum caixa aberto hoje. Abra o caixa antes de finalizar a venda." },
      { status: 400 }
    );
  }

  const total = itens.reduce((acc, i) => acc + (i.preco ?? 0) * (i.quantidade ?? 1), 0);

  // Lançamento financeiro
  await LancamentoFinanceiro.create({
    caixa: caixa._id,
    tipo: "entrada",
    categoria: "Vendas salão",
    valor: total,
    descricao: `PDV avulso — ${itens.length} ${itens.length === 1 ? "item" : "itens"}`,
    forma_pagamento,
    criadoPor: session.user.id,
    origem: "pdv",
  });

  // Movimento de estoque — usa o primeiro local de estoque disponível
  const localPadrao = await LocalEstoque.findOne().lean();

  if (localPadrao) {
    await Promise.allSettled(
      itens.map(async (item) => {
        const estoqueLocal = await EstoqueLocal.findOne({
          produto: item.produtoId,
          localEstoque: localPadrao._id,
        });
        if (estoqueLocal) {
          estoqueLocal.quantidade = Math.max(0, estoqueLocal.quantidade - item.quantidade);
          await estoqueLocal.save();
        }
      })
    );
  }

  return NextResponse.json({ data: { total, forma_pagamento } }, { status: 201 });
}
