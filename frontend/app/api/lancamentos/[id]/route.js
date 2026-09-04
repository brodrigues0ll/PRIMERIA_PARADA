import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import LancamentoFinanceiro from "@/lib/models/LancamentoFinanceiro";
import CaixaDiario from "@/lib/models/CaixaDiario";

export async function DELETE(request, { params }) {
  const { session, error } = await requirePermission("financeiro");
  if (error) return error;

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
