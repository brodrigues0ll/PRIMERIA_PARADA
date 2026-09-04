import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { auditLog, ACOES } from "@/lib/audit";
import connectDB from "@/lib/mongodb";
import { PedidoDelivery, CaixaDiario, LancamentoFinanceiro } from "@/lib/models";

const FLUXO = ["recebido", "em_preparo", "saiu", "entregue"];

export async function PATCH(request, { params }) {
  const { session, error } = await getAuthSession();
  if (error) return error;

  await connectDB();

  const { id } = await params;
  const pedido = await PedidoDelivery.findById(id);
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  if (pedido.status === "cancelado")
    return NextResponse.json({ error: "Pedido cancelado não pode ter status alterado" }, { status: 400 });

  if (pedido.status === "entregue")
    return NextResponse.json({ error: "Pedido já entregue" }, { status: 400 });

  let body = {};
  try { body = await request.json(); } catch { body = {}; }

  const statusForçado = body?.status;

  if (statusForçado) {
    if (statusForçado === "cancelado") {
      pedido.status = "cancelado";
      await auditLog(session, ACOES.DELIVERY_CANCELAR, "PedidoDelivery", id, {
        total: pedido.total,
      });
    } else {
      const indexAtual = FLUXO.indexOf(pedido.status);
      const indexNovo = FLUXO.indexOf(statusForçado);

      if (indexNovo === -1)
        return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      if (indexNovo <= indexAtual)
        return NextResponse.json({ error: "Não é possível voltar o status" }, { status: 400 });

      pedido.status = statusForçado;
    }
  } else {
    const indexAtual = FLUXO.indexOf(pedido.status);
    if (indexAtual === -1 || indexAtual === FLUXO.length - 1)
      return NextResponse.json({ error: "Não há próximo status disponível" }, { status: 400 });

    pedido.status = FLUXO[indexAtual + 1];
  }

  await pedido.save();

  // Lançamento automático ao entregar (apenas pedidos pagos na hora, não "na conta")
  if (pedido.status === "entregue" && !pedido.na_conta) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const caixa = await CaixaDiario.findOne({
      data: { $gte: startOfDay, $lte: endOfDay },
      status: "aberto",
    }).lean();

    if (caixa) {
      const nomeCliente = pedido.nome_avulso ?? "Cliente";
      const formaMap = { dinheiro: "dinheiro", pix: "pix", cartao: "credito" };
      await LancamentoFinanceiro.create({
        caixa: caixa._id,
        tipo: "entrada",
        categoria: "Vendas delivery",
        valor: pedido.total,
        descricao: `Delivery: ${nomeCliente}`,
        forma_pagamento: formaMap[pedido.forma_pagamento] ?? pedido.forma_pagamento,
        criadoPor: session.user.id,
        origem: "delivery",
        referencia: pedido._id.toString(),
      });
    }

    await auditLog(session, ACOES.DELIVERY_ENTREGAR, "PedidoDelivery", id, {
      total: pedido.total,
      forma_pagamento: pedido.forma_pagamento,
    });
  }

  return NextResponse.json({ data: pedido });
}
