import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { MenuItem } from "@/lib/models";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const item = await MenuItem.findById(id).populate("produtoRef");

  if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  return NextResponse.json({ data: item });
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const { nome, preco, produtoRef } = await request.json();

  await connectDB();

  const updates = {};
  if (nome !== undefined) updates.nome = nome.trim();
  if (preco !== undefined) updates.preco = Number(preco);
  if (produtoRef !== undefined) updates.produtoRef = produtoRef || null;

  const item = await MenuItem.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  return NextResponse.json({ data: item });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const item = await MenuItem.findByIdAndDelete(id);

  if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  return NextResponse.json({ message: "Item removido com sucesso" });
}
