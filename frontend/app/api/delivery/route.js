import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import PedidoDelivery from "@/lib/models/PedidoDelivery";
import MenuItem from "@/lib/models/MenuItem";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(request.url);
  const dataParam = searchParams.get("data");
  const statusParam = searchParams.get("status");
  const clienteId = searchParams.get("cliente_id");

  const dataBase = dataParam ? new Date(dataParam) : new Date();
  const inicio = new Date(dataBase);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(dataBase);
  fim.setHours(23, 59, 59, 999);

  const filtro = {
    createdAt: { $gte: inicio, $lte: fim },
  };

  if (statusParam) filtro.status = statusParam;
  if (clienteId) filtro.cliente = clienteId;

  const pedidos = await PedidoDelivery.find(filtro)
    .populate("cliente", "nome telefone")
    .populate("itens.menuItem", "nome")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ data: pedidos });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const {
    cliente_id,
    nome_avulso,
    endereco_entrega,
    itens,
    forma_pagamento,
    troco_para,
    na_conta,
  } = body;

  if (!itens || itens.length === 0)
    return NextResponse.json({ error: "Pedido deve ter ao menos um item" }, { status: 400 });

  if (!forma_pagamento)
    return NextResponse.json({ error: "Forma de pagamento é obrigatória" }, { status: 400 });

  if (na_conta && !cliente_id)
    return NextResponse.json(
      { error: "Cliente é obrigatório para pedidos na conta" },
      { status: 400 }
    );

  await connectDB();

  let itensDesnormalizados;
  try {
    itensDesnormalizados = await Promise.all(
      itens.map(async ({ menuItemId, quantidade, observacao }) => {
        const menuItem = await MenuItem.findById(menuItemId).lean();
        if (!menuItem)
          throw new Error(`MenuItem ${menuItemId} não encontrado`);
        return {
          menuItem: menuItemId,
          nome: menuItem.nome,
          preco: menuItem.preco,
          quantidade: quantidade || 1,
          observacao: observacao || "",
        };
      })
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const total = itensDesnormalizados.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  const pedido = await PedidoDelivery.create({
    cliente: cliente_id || null,
    nome_avulso: nome_avulso || null,
    endereco_entrega: endereco_entrega || {},
    itens: itensDesnormalizados,
    total,
    forma_pagamento,
    troco_para: troco_para ?? null,
    na_conta: Boolean(na_conta),
  });

  return NextResponse.json({ data: pedido }, { status: 201 });
}
