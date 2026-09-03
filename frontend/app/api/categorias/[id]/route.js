import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Categoria from "@/lib/models/Categoria";
import MenuItem from "@/lib/models/MenuItem";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const cat = await Categoria.findById(id).lean();

  if (!cat) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });

  return NextResponse.json(cat);
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const body = await request.json();
  const updates = {};
  if (body.nome !== undefined) updates.nome = body.nome.trim();
  if (body.ordem !== undefined) updates.ordem = body.ordem;
  if (body.cor !== undefined) updates.cor = body.cor;
  if (body.ativo !== undefined) updates.ativo = body.ativo;

  const cat = await Categoria.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  if (!cat) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });

  return NextResponse.json(cat);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const hasItems = await MenuItem.exists({ categoria: id });
  if (hasItems)
    return NextResponse.json({ error: "Categoria possui itens vinculados" }, { status: 409 });

  const cat = await Categoria.findByIdAndDelete(id);
  if (!cat) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
