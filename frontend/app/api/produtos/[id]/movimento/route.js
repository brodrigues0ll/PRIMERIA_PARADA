import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Produto from "@/lib/models/Produto";
import MovimentoEstoque from "@/lib/models/MovimentoEstoque";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const { tipo, quantidade, observacao } = await req.json();

  if (!["entrada", "saida", "ajuste"].includes(tipo))
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

  const qty = Math.round(Number(quantidade));
  if (isNaN(qty) || qty < 0)
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });

  await connectDB();

  const produto = await Produto.findById(id);
  if (!produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const anterior = produto.quantidade;
  let nova;
  if (tipo === "entrada") nova = anterior + qty;
  else if (tipo === "saida") nova = Math.max(0, anterior - qty);
  else nova = qty;

  produto.quantidade = nova;
  await produto.save();

  await MovimentoEstoque.create({
    produto: id,
    tipo,
    quantidade: qty,
    quantidadeAnterior: anterior,
    quantidadeNova: nova,
    observacao: observacao?.trim() ?? "",
  });

  return NextResponse.json({ data: produto });
}
