import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import GrupoMesas from "@/lib/models/GrupoMesas";
import Comanda from "@/lib/models/Comanda";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();

  const { id } = await params;
  const grupo = await GrupoMesas.findById(id).populate("mesas", "nome capacidade").populate("comanda", "nome status _id").lean();
  if (!grupo) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
  return NextResponse.json({ data: grupo });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();

  const { id } = await params;
  const grupo = await GrupoMesas.findByIdAndUpdate(id, { ativo: false, fechadaEm: new Date() }, { new: true });
  if (!grupo) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });

  // Desvincular comanda do grupo (comanda continua aberta)
  if (grupo.comanda) {
    await Comanda.findByIdAndUpdate(grupo.comanda, { grupo: null, mesa: null });
  }

  return NextResponse.json({ ok: true });
}
