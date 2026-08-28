import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { MenuItem } from "@/lib/models";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(request.url);
  const produtoId = searchParams.get("produtoId");

  if (produtoId) {
    // Busca o item do cardápio vinculado a um produto do estoque (usado no PDV)
    const item = await MenuItem.findOne({ produtoRef: produtoId }).lean();
    return NextResponse.json({ data: item || null });
  }

  const items = await MenuItem.find({}).sort({ nome: 1 }).lean();
  return NextResponse.json({ data: items });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { nome, preco, produtoRef } = await request.json();

  if (!nome?.trim() || preco === undefined || preco === null)
    return NextResponse.json({ error: "Nome e preço são obrigatórios" }, { status: 400 });

  await connectDB();

  const item = await MenuItem.create({
    nome: nome.trim(),
    preco: Number(preco),
    produtoRef: produtoRef || null,
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
