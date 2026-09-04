import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Fornecedor from "@/lib/models/Fornecedor";

export async function GET(req, { params }) {
  const { error } = await requirePermission("configuracoes");
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const fornecedor = await Fornecedor.findById(id).lean();
  if (!fornecedor) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ data: fornecedor });
}

export async function PATCH(request, { params }) {
  const { error } = await requirePermission("configuracoes");
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const fornecedor = await Fornecedor.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true, runValidators: true }
  ).lean();

  if (!fornecedor) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ data: fornecedor });
}

export async function DELETE(req, { params }) {
  const { error } = await requirePermission("configuracoes");
  if (error) return error;

  await connectDB();
  const { id } = await params;

  await Fornecedor.findByIdAndUpdate(id, { ativo: false });
  return NextResponse.json({ data: { desativado: true } });
}
