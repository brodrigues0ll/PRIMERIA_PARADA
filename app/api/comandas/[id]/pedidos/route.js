import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { Pedido, MenuItem } from "@/lib/models";
import Produto from "@/lib/models/Produto";
import MovimentoEstoque from "@/lib/models/MovimentoEstoque";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const pedidos = await Pedido.find({ comanda: id });
  return NextResponse.json({ data: pedidos });
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const { menuItemId } = await request.json();

  if (!menuItemId) return NextResponse.json({ error: "menuItemId é obrigatório" }, { status: 400 });

  await connectDB();

  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) return NextResponse.json({ error: "Item do cardápio não encontrado" }, { status: 404 });

  const existing = await Pedido.findOne({ comanda: id, menuItem: menuItemId });

  let pedido;
  if (existing) {
    pedido = await Pedido.findByIdAndUpdate(existing._id, { $inc: { quantidade: 1 } }, { new: true });
  } else {
    pedido = await Pedido.create({
      comanda: id,
      menuItem: menuItemId,
      nome: menuItem.nome,
      preco: menuItem.preco,
      quantidade: 1,
    });
  }

  // Decrementa o produto de estoque vinculado, se houver
  if (menuItem.produtoRef) {
    await ajustarProduto(menuItem.produtoRef, -1, "Venda via comanda");
  }

  return NextResponse.json({ data: pedido }, { status: existing ? 200 : 201 });
}

export async function ajustarProduto(produtoId, delta, obs) {
  const produto = await Produto.findById(produtoId);
  if (!produto) return;
  const anterior = produto.quantidade;
  const nova = Math.max(0, anterior + delta);
  produto.quantidade = nova;
  await produto.save();
  await MovimentoEstoque.create({
    produto: produtoId,
    tipo: delta < 0 ? "saida" : "entrada",
    quantidade: Math.abs(delta),
    quantidadeAnterior: anterior,
    quantidadeNova: nova,
    observacao: obs,
  });
}
