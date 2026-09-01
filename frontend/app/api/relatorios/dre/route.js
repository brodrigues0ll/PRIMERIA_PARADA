import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import LancamentoFinanceiro from "@/lib/models/LancamentoFinanceiro";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(request.url);
  const inicioParam = searchParams.get("inicio");
  const fimParam = searchParams.get("fim");

  if (!inicioParam || !fimParam) {
    return NextResponse.json(
      { error: "Parâmetros inicio e fim são obrigatórios" },
      { status: 400 }
    );
  }

  const inicio = new Date(inicioParam);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(fimParam);
  fim.setHours(23, 59, 59, 999);

  const lancamentos = await LancamentoFinanceiro.aggregate([
    { $match: { data: { $gte: inicio, $lte: fim } } },
    {
      $group: {
        _id: { tipo: "$tipo", categoria: "$categoria", membro: "$membro_familiar" },
        total: { $sum: "$valor" },
      },
    },
  ]);

  const receitas = { total: 0, porCategoria: [] };
  const despesas = { total: 0, porCategoria: [] };
  const consumoFamiliarMap = {};

  const receitasCatMap = {};
  const despesasCatMap = {};

  for (const item of lancamentos) {
    const { tipo, categoria, membro } = item._id;
    const { total } = item;

    if (tipo === "entrada") {
      receitas.total += total;
      receitasCatMap[categoria] = (receitasCatMap[categoria] || 0) + total;
    } else {
      despesas.total += total;
      despesasCatMap[categoria] = (despesasCatMap[categoria] || 0) + total;

      if (categoria === "Consumo familiar" && membro) {
        consumoFamiliarMap[membro] = (consumoFamiliarMap[membro] || 0) + total;
      }
    }
  }

  receitas.porCategoria = Object.entries(receitasCatMap).map(([categoria, total]) => ({
    categoria,
    total,
  }));

  despesas.porCategoria = Object.entries(despesasCatMap).map(([categoria, total]) => ({
    categoria,
    total,
  }));

  const consumoFamiliarTotal = Object.values(consumoFamiliarMap).reduce(
    (acc, v) => acc + v,
    0
  );

  const consumoFamiliar = {
    total: consumoFamiliarTotal,
    porMembro: Object.entries(consumoFamiliarMap).map(([membro, total]) => ({
      membro,
      total,
    })),
  };

  return NextResponse.json({
    data: {
      periodo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
      receitas,
      despesas,
      resultado: receitas.total - despesas.total,
      consumoFamiliar,
    },
  });
}
