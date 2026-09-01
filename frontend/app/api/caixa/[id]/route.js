import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import CaixaDiario from "@/lib/models/CaixaDiario";
import LancamentoFinanceiro from "@/lib/models/LancamentoFinanceiro";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { id } = await params;

  const caixa = await CaixaDiario.findById(id).lean();
  if (!caixa) {
    return NextResponse.json({ error: "Caixa não encontrado" }, { status: 404 });
  }

  const lancamentos = await LancamentoFinanceiro.find({ caixa: id })
    .sort({ data: -1 })
    .lean();

  return NextResponse.json({ data: { ...caixa, lancamentos } });
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { id } = await params;
  const body = await request.json();
  const { action, saldo_final } = body;

  const caixa = await CaixaDiario.findById(id);
  if (!caixa) {
    return NextResponse.json({ error: "Caixa não encontrado" }, { status: 404 });
  }

  if (action === "fechar") {
    if (caixa.status === "fechado") {
      return NextResponse.json(
        { error: "Caixa já está fechado" },
        { status: 400 }
      );
    }

    if (saldo_final === undefined || saldo_final === null) {
      return NextResponse.json(
        { error: "Saldo final é obrigatório para fechar o caixa" },
        { status: 400 }
      );
    }

    caixa.status = "fechado";
    caixa.saldo_final = Number(saldo_final);
    await caixa.save();

    return NextResponse.json({ data: caixa });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
