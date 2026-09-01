import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Mesa from "@/lib/models/Mesa";
import Comanda from "@/lib/models/Comanda";
import GrupoMesas from "@/lib/models/GrupoMesas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();

  const [mesas, comandasAbertas, gruposAtivos] = await Promise.all([
    Mesa.find({ ativa: true }).sort({ ordem: 1, createdAt: 1 }).lean(),
    Comanda.find({ status: "aberta", mesa: { $ne: null } }).select("_id nome mesa").lean(),
    GrupoMesas.find({ ativo: true }).lean(),
  ]);

  const comandaByMesa = {};
  for (const c of comandasAbertas) {
    if (c.mesa) comandaByMesa[c.mesa.toString()] = c;
  }

  const grupoByMesa = {};
  for (const g of gruposAtivos) {
    for (const mesaId of g.mesas) {
      grupoByMesa[mesaId.toString()] = g;
    }
  }

  const resultado = mesas.map((mesa) => {
    const id = mesa._id.toString();
    const comanda = comandaByMesa[id];
    const grupo = grupoByMesa[id];

    if (grupo) {
      return { mesa, status: "grupo", comandaId: grupo.comanda, grupoId: grupo._id, comandaNome: null };
    }
    if (comanda) {
      return { mesa, status: "ocupada", comandaId: comanda._id, grupoId: null, comandaNome: comanda.nome };
    }
    return { mesa, status: "livre", comandaId: null, grupoId: null, comandaNome: null };
  });

  return NextResponse.json({ data: resultado });
}
