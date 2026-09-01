import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import EstoqueLocal from "@/lib/models/EstoqueLocal";
import Produto from "@/lib/models/Produto";
import MovimentoEstoque from "@/lib/models/MovimentoEstoque";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();

  const { produtoId, localOrigemId, localDestinoId, quantidade } = await req.json();

  if (!produtoId || !localOrigemId || !localDestinoId || !quantidade || quantidade <= 0)
    return NextResponse.json({ error: "Dados inválidos para transferência" }, { status: 400 });

  if (localOrigemId === localDestinoId)
    return NextResponse.json({ error: "Origem e destino devem ser diferentes" }, { status: 400 });

  // Check origem has sufficient stock
  const origem = await EstoqueLocal.findOne({ produto: produtoId, local: localOrigemId });
  if (!origem || origem.quantidade < quantidade)
    return NextResponse.json(
      { error: "Estoque insuficiente no local de origem" },
      { status: 409 }
    );

  const produto = await Produto.findById(produtoId);
  if (!produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  // Decrement origem
  origem.quantidade -= quantidade;
  await origem.save();

  // Increment destino (upsert)
  const destino = await EstoqueLocal.findOneAndUpdate(
    { produto: produtoId, local: localDestinoId },
    { $inc: { quantidade } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Recalculate Produto.quantidade from sum of all locals
  const todos = await EstoqueLocal.find({ produto: produtoId });
  const totalQty = todos.reduce((sum, e) => sum + e.quantidade, 0);
  await Produto.findByIdAndUpdate(produtoId, { quantidade: totalQty });

  // Create movement
  await MovimentoEstoque.create({
    produto: produtoId,
    tipo: "transferencia",
    quantidade,
    quantidadeAnterior: produto.quantidade,
    quantidadeNova: totalQty,
    observacao: `Transferência de local`,
    local_origem: localOrigemId,
    local_destino: localDestinoId,
  });

  return NextResponse.json({ data: { origem, destino, quantidadeTotal: totalQty } });
}
