import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Produto from "@/lib/models/Produto";
import MovimentoEstoque from "@/lib/models/MovimentoEstoque";
import { MenuItem } from "@/lib/models";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const [produto, historico] = await Promise.all([
    Produto.findById(id).lean(),
    MovimentoEstoque.find({ produto: id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
  ]);

  if (!produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  return NextResponse.json({ data: produto, historico });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  await connectDB();

  const updates = {};
  if (body.nome !== undefined) updates.nome = body.nome.trim();
  if (body.codigo !== undefined) updates.codigo = body.codigo.trim();
  if (body.precoCompra !== undefined) updates.precoCompra = Number(body.precoCompra) || 0;
  if (body.precoVenda !== undefined) updates.precoVenda = Number(body.precoVenda) || 0;
  if (body.minimo !== undefined) updates.minimo = Math.round(Number(body.minimo)) || 0;
  if (body.imagem !== undefined) updates.imagem = body.imagem;

  const produto = await Produto.findByIdAndUpdate(id, updates, { new: true });
  if (!produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  return NextResponse.json({ data: produto });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const produto = await Produto.findByIdAndDelete(id);
  if (!produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  // Remove movimentos e desvincula MenuItems que apontavam para este produto
  await Promise.all([
    MovimentoEstoque.deleteMany({ produto: id }),
    MenuItem.updateMany({ produtoRef: id }, { $unset: { produtoRef: "" } }),
  ]);

  return NextResponse.json({ message: "Produto removido" });
}
