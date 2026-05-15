import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { Pedido, MenuItem } from "@/lib/models";
import { ajustarProduto } from "../route";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { pedidoId } = await params;
  const { action } = await request.json();

  if (!["increment", "decrement"].includes(action))
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });

  await connectDB();
  const pedido = await Pedido.findById(pedidoId);
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  const menuItem = pedido.menuItem ? await MenuItem.findById(pedido.menuItem) : null;
  const produtoId = menuItem?.produtoRef ?? null;

  if (action === "decrement" && pedido.quantidade <= 1) {
    await Pedido.findByIdAndDelete(pedidoId);
    if (produtoId) await ajustarProduto(produtoId, +1, "Remoção de item da comanda");
    return NextResponse.json({ message: "Pedido removido" });
  }

  const delta = action === "increment" ? 1 : -1;
  const updated = await Pedido.findByIdAndUpdate(pedidoId, { $inc: { quantidade: delta } }, { new: true });

  if (produtoId) {
    await ajustarProduto(
      produtoId,
      -delta,
      action === "increment" ? "Adição via comanda" : "Remoção via comanda"
    );
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { pedidoId } = await params;
  await connectDB();
  const pedido = await Pedido.findByIdAndDelete(pedidoId);
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  return NextResponse.json({ message: "Pedido removido com sucesso" });
}
