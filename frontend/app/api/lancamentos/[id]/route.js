import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import LancamentoFinanceiro from "@/lib/models/LancamentoFinanceiro";
import CaixaDiario from "@/lib/models/CaixaDiario";

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { id } = await params;

  const lancamento = await LancamentoFinanceiro.findById(id).lean();
  if (!lancamento) {
    return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
  }

  const caixa = await CaixaDiario.findById(lancamento.caixa).lean();
  if (!caixa || caixa.status !== "aberto") {
    return NextResponse.json(
      { error: "Não é possível remover lançamentos de um caixa fechado" },
      { status: 400 }
    );
  }

  await LancamentoFinanceiro.findByIdAndDelete(id);

  return NextResponse.json({ data: { deletado: true } });
}
