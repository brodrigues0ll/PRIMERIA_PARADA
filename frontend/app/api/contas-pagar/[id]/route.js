import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import ContaAPagar from "@/lib/models/ContaAPagar";
import LancamentoFinanceiro from "@/lib/models/LancamentoFinanceiro";
import CaixaDiario from "@/lib/models/CaixaDiario";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { id } = await params;
  const body = await request.json();
  const { action, caixaId } = body;

  const conta = await ContaAPagar.findById(id);
  if (!conta) {
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
  }

  if (action === "pagar") {
    if (conta.status === "pago") {
      return NextResponse.json({ error: "Conta já está paga" }, { status: 400 });
    }

    conta.status = "pago";
    conta.pago_em = new Date();

    if (caixaId) {
      const caixa = await CaixaDiario.findById(caixaId).lean();
      if (!caixa) {
        return NextResponse.json({ error: "Caixa não encontrado" }, { status: 404 });
      }
      if (caixa.status !== "aberto") {
        return NextResponse.json(
          { error: "Caixa está fechado. Não é possível registrar lançamento." },
          { status: 400 }
        );
      }

      const lancamento = await LancamentoFinanceiro.create({
        caixa: caixaId,
        tipo: "saida",
        categoria: conta.categoria,
        valor: conta.valor,
        descricao: `Pagamento: ${conta.descricao}`,
        data: new Date(),
        referencia: conta._id.toString(),
      });

      conta.lancamento = lancamento._id;
    }

    await conta.save();
    return NextResponse.json({ data: conta });
  }

  if (action === "reabrir") {
    if (conta.status === "pendente") {
      return NextResponse.json({ error: "Conta já está pendente" }, { status: 400 });
    }

    conta.status = "pendente";
    conta.pago_em = null;
    conta.lancamento = null;

    await conta.save();
    return NextResponse.json({ data: conta });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { id } = await params;

  const conta = await ContaAPagar.findById(id).lean();
  if (!conta) {
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
  }

  if (conta.status !== "pendente") {
    return NextResponse.json(
      { error: "Só é possível remover contas pendentes" },
      { status: 400 }
    );
  }

  await ContaAPagar.findByIdAndDelete(id);

  return NextResponse.json({ data: { deletado: true } });
}
