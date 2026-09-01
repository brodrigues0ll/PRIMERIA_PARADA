import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import LocalEstoque from "@/lib/models/LocalEstoque";
import EstoqueLocal from "@/lib/models/EstoqueLocal";
import Produto from "@/lib/models/Produto";
import MovimentoEstoque from "@/lib/models/MovimentoEstoque";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const { id } = await params;
  const { produtoId, quantidade, observacao } = await req.json();

  if (!produtoId || !quantidade || quantidade <= 0)
    return NextResponse.json({ error: "produtoId e quantidade são obrigatórios" }, { status: 400 });

  const local = await LocalEstoque.findById(id);
  if (!local || !local.ativo)
    return NextResponse.json({ error: "Local não encontrado" }, { status: 404 });

  const estoqueLocal = await EstoqueLocal.findOne({ produto: produtoId, local: id });
  if (!estoqueLocal || estoqueLocal.quantidade < quantidade)
    return NextResponse.json(
      { error: "Estoque insuficiente neste local" },
      { status: 409 }
    );

  const produto = await Produto.findById(produtoId);
  if (!produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  // Decrement EstoqueLocal
  estoqueLocal.quantidade -= quantidade;
  await estoqueLocal.save();

  // Update Produto.quantidade total
  const quantidadeAnterior = produto.quantidade;
  const quantidadeNova = Math.max(0, quantidadeAnterior - quantidade);
  await Produto.findByIdAndUpdate(produtoId, { quantidade: quantidadeNova });

  // Create movement
  await MovimentoEstoque.create({
    produto: produtoId,
    tipo: "saida",
    quantidade,
    quantidadeAnterior,
    quantidadeNova,
    observacao: observacao || "",
    local_origem: id,
  });

  return NextResponse.json({ data: estoqueLocal });
}
