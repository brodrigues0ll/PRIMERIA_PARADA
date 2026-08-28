import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import PedidoDelivery from "@/lib/models/PedidoDelivery";
import MenuItem from "@/lib/models/MenuItem";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const pedido = await PedidoDelivery.findById(params.id)
    .populate("cliente", "nome telefone")
    .populate("itens.menuItem")
    .lean();

  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  return NextResponse.json({ data: pedido });
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const pedido = await PedidoDelivery.findById(params.id);
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  if (pedido.status !== "recebido")
    return NextResponse.json(
      { error: "Somente pedidos com status 'recebido' podem ser editados" },
      { status: 400 }
    );

  const body = await request.json();
  const { itens, forma_pagamento, troco_para, endereco_entrega, na_conta } = body;

  if (itens !== undefined) {
    let itensDesnormalizados;
    try {
      itensDesnormalizados = await Promise.all(
        itens.map(async ({ menuItemId, quantidade, observacao }) => {
          const menuItem = await MenuItem.findById(menuItemId).lean();
          if (!menuItem) throw new Error(`MenuItem ${menuItemId} não encontrado`);
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

    pedido.itens = itensDesnormalizados;
    pedido.total = itensDesnormalizados.reduce(
      (acc, item) => acc + item.preco * item.quantidade,
      0
    );
  }

  if (forma_pagamento !== undefined) pedido.forma_pagamento = forma_pagamento;
  if (troco_para !== undefined) pedido.troco_para = troco_para;
  if (endereco_entrega !== undefined) pedido.endereco_entrega = endereco_entrega;
  if (na_conta !== undefined) pedido.na_conta = Boolean(na_conta);

  await pedido.save();

  return NextResponse.json({ data: pedido });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const pedido = await PedidoDelivery.findById(params.id);
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  pedido.status = "cancelado";
  await pedido.save();

  return NextResponse.json({ data: pedido });
}
