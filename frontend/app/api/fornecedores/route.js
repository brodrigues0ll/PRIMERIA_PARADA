import { NextResponse } from "next/server";
import { getAuthSession, requirePermission } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Fornecedor from "@/lib/models/Fornecedor";

export async function GET() {
  const { error } = await getAuthSession();
  if (error) return error;

  await connectDB();
  const fornecedores = await Fornecedor.find({ ativo: true }).sort({ nome: 1 }).lean();
  return NextResponse.json({ data: fornecedores });
}

export async function POST(request) {
  const { session, error } = await requirePermission("configuracoes");
  if (error) return error;

  await connectDB();
  const body = await request.json();
  const { nome, cnpj, telefone, email, contato, observacoes } = body;

  if (!nome?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const fornecedor = await Fornecedor.create({
    nome: nome.trim(),
    cnpj: cnpj?.trim() || "",
    telefone: telefone?.trim() || "",
    email: email?.trim() || "",
    contato: contato?.trim() || "",
    observacoes: observacoes?.trim() || "",
  });

  return NextResponse.json({ data: fornecedor }, { status: 201 });
}
