import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PlanoContas from "@/lib/models/PlanoContas";

export async function PATCH(request, { params }) {
  const { error } = await requirePermission("configuracoes");
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const cat = await PlanoContas.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  if (!cat) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ data: cat });
}

export async function DELETE(req, { params }) {
  const { error } = await requirePermission("configuracoes");
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const cat = await PlanoContas.findById(id).lean();
  if (!cat) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (cat.sistema) {
    return NextResponse.json({ error: "Categoria padrão não pode ser removida" }, { status: 400 });
  }

  await PlanoContas.findByIdAndUpdate(id, { ativo: false });
  return NextResponse.json({ data: { desativado: true } });
}
