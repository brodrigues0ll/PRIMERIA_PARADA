import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Cliente from "@/lib/models/Cliente";
import PedidoDelivery from "@/lib/models/PedidoDelivery";
import PagamentoCliente from "@/lib/models/PagamentoCliente";

async function getPedidosEmAberto(clienteId) {
  const pedidosNaConta = await PedidoDelivery.find({
    cliente: clienteId,
    na_conta: true,
    status: { $ne: "cancelado" },
  })
    .populate("itens.menuItem", "nome")
    .sort({ createdAt: -1 })
    .lean();

  if (pedidosNaConta.length === 0) return { pedidos: [], saldo: 0 };

  const idsPedidos = pedidosNaConta.map((p) => p._id);

  const pagamentos = await PagamentoCliente.find({
    cliente: clienteId,
    pedidos_quitados: { $in: idsPedidos },
  })
    .select("pedidos_quitados")
    .lean();

  const idsQuitados = new Set(
    pagamentos.flatMap((pg) => pg.pedidos_quitados.map((id) => id.toString()))
  );

  const pedidosEmAberto = pedidosNaConta.filter(
    (p) => !idsQuitados.has(p._id.toString())
  );

  const saldo = pedidosEmAberto.reduce((acc, p) => acc + p.total, 0);

  return { pedidos: pedidosEmAberto, saldo };
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const cliente = await Cliente.findById(params.id).lean();
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const { pedidos: pedidos_em_aberto, saldo: saldo_em_aberto } = await getPedidosEmAberto(params.id);

  const historico_pagamentos = await PagamentoCliente.find({ cliente: params.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return NextResponse.json({
    data: {
      ...cliente,
      pedidos_em_aberto,
      historico_pagamentos,
      saldo_em_aberto,
    },
  });
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const cliente = await Cliente.findById(params.id);
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const body = await request.json();
  const camposPermitidos = ["nome", "telefone", "enderecos", "perfil_pagamento", "observacoes", "ativo"];

  camposPermitidos.forEach((campo) => {
    if (body[campo] !== undefined) {
      cliente[campo] = body[campo];
    }
  });

  await cliente.save();

  return NextResponse.json({ data: cliente });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const cliente = await Cliente.findById(params.id);
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const { saldo } = await getPedidosEmAberto(params.id);
  if (saldo > 0) {
    return NextResponse.json(
      { error: "Cliente possui saldo em aberto e não pode ser desativado" },
      { status: 400 }
    );
  }

  cliente.ativo = false;
  await cliente.save();

  return NextResponse.json({ data: { message: "Cliente desativado com sucesso" } });
}
