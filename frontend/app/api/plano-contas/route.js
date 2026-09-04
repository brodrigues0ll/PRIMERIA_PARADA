import { NextResponse } from "next/server";
import { requirePermission, getAuthSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PlanoContas from "@/lib/models/PlanoContas";
import { CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from "@/lib/constants/financeiro";

async function seedCategoriasDefault() {
  const count = await PlanoContas.countDocuments();
  if (count > 0) return;

  const entradas = CATEGORIAS_ENTRADA.map((nome, i) => ({
    nome, tipo: "entrada", ordem: i, sistema: true,
  }));
  const saidas = CATEGORIAS_SAIDA.map((nome, i) => ({
    nome, tipo: "saida", ordem: i, sistema: true,
  }));

  await PlanoContas.insertMany([...entradas, ...saidas]);
}

export async function GET() {
  const { error } = await getAuthSession();
  if (error) return error;

  await connectDB();
  await seedCategoriasDefault();

  const categorias = await PlanoContas.find({ ativo: true })
    .sort({ tipo: 1, ordem: 1 })
    .lean();

  return NextResponse.json({ data: categorias });
}

export async function POST(request) {
  const { error } = await requirePermission("configuracoes");
  if (error) return error;

  await connectDB();
  const body = await request.json();
  const { nome, tipo } = body;

  if (!nome?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!["entrada", "saida"].includes(tipo))
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

  const last = await PlanoContas.findOne({ tipo }).sort({ ordem: -1 }).lean();
  const ordem = (last?.ordem ?? -1) + 1;

  const categoria = await PlanoContas.create({ nome: nome.trim(), tipo, ordem });
  return NextResponse.json({ data: categoria }, { status: 201 });
}
