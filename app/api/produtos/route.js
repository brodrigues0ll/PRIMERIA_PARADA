import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Produto from "@/lib/models/Produto";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(request.url);
  const codigo = searchParams.get("codigo");

  if (codigo) {
    const produto = await Produto.findOne({ codigo: codigo.trim() }).lean();
    return NextResponse.json({ data: produto || null });
  }

  const produtos = await Produto.find({}).sort({ nome: 1 }).lean();
  return NextResponse.json({ data: produtos });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { nome, codigo, imagem, precoCompra, precoVenda, quantidade, minimo } = await request.json();

  if (!nome?.trim())
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  await connectDB();

  const produto = await Produto.create({
    nome: nome.trim(),
    codigo: codigo?.trim() || "",
    imagem: imagem ?? null,
    precoCompra: Number(precoCompra) || 0,
    precoVenda: Number(precoVenda) || 0,
    quantidade: Math.round(Number(quantidade)) || 0,
    minimo: Math.round(Number(minimo)) || 0,
  });

  return NextResponse.json({ data: produto }, { status: 201 });
}
