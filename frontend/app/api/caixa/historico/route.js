import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import CaixaDiario from "@/lib/models/CaixaDiario";
import LancamentoFinanceiro from "@/lib/models/LancamentoFinanceiro";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const caixas = await CaixaDiario.find()
    .sort({ data: -1 })
    .limit(30)
    .lean();

  if (caixas.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const caixaIds = caixas.map((c) => c._id);

  const totais = await LancamentoFinanceiro.aggregate([
    { $match: { caixa: { $in: caixaIds } } },
    {
      $group: {
        _id: { caixa: "$caixa", tipo: "$tipo" },
        total: { $sum: "$valor" },
      },
    },
  ]);

  const totaisMap = {};
  for (const t of totais) {
    const key = t._id.caixa.toString();
    if (!totaisMap[key]) totaisMap[key] = { entradas: 0, saidas: 0 };
    if (t._id.tipo === "entrada") totaisMap[key].entradas = t.total;
    if (t._id.tipo === "saida") totaisMap[key].saidas = t.total;
  }

  const resultado = caixas.map((c) => ({
    ...c,
    totais: totaisMap[c._id.toString()] || { entradas: 0, saidas: 0 },
  }));

  return NextResponse.json({ data: resultado });
}
