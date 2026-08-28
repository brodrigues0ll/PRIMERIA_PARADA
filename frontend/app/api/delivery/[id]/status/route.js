import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import PedidoDelivery from "@/lib/models/PedidoDelivery";

const FLUXO = ["recebido", "em_preparo", "saiu", "entregue"];

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const pedido = await PedidoDelivery.findById(params.id);
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  if (pedido.status === "cancelado")
    return NextResponse.json({ error: "Pedido cancelado não pode ter status alterado" }, { status: 400 });

  if (pedido.status === "entregue")
    return NextResponse.json({ error: "Pedido já entregue" }, { status: 400 });

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const statusForçado = body?.status;

  if (statusForçado) {
    if (statusForçado === "cancelado") {
      pedido.status = "cancelado";
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

  return NextResponse.json({ data: pedido });
}
