import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import CaixaDiario from "@/lib/models/CaixaDiario";

export async function GET() {
  const { session, error } = await requirePermission("financeiro");
  if (error) return error;

  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const caixa = await CaixaDiario.findOne({
    data: { $gte: startOfDay, $lte: endOfDay },
  }).lean();

  return NextResponse.json({ data: caixa || null });
}

export async function POST(request) {
  const { session, error } = await requirePermission("financeiro");
  if (error) return error;

  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const existente = await CaixaDiario.findOne({
    data: { $gte: startOfDay, $lte: endOfDay },
  }).lean();

  if (existente) {
    return NextResponse.json(
      { error: "Já existe um caixa aberto para hoje" },
      { status: 409 }
    );
  }

  const body = await request.json();
  const { saldo_inicial } = body;

  if (saldo_inicial === undefined || saldo_inicial === null) {
    return NextResponse.json(
      { error: "Saldo inicial é obrigatório" },
      { status: 400 }
    );
  }

  const caixa = await CaixaDiario.create({
    data: new Date(),
    saldo_inicial: Number(saldo_inicial),
    abertoPor: session.user.id,
  });

  return NextResponse.json({ data: caixa }, { status: 201 });
}
