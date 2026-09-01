import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import GrupoMesas from "@/lib/models/GrupoMesas";
import Comanda from "@/lib/models/Comanda";
import Mesa from "@/lib/models/Mesa";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const grupos = await GrupoMesas.find({ ativo: true }).populate("mesas", "nome").populate("comanda", "nome status").lean();
  return NextResponse.json({ data: grupos });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();

  const { mesaIds, nome } = await request.json();
  if (!mesaIds || mesaIds.length < 2) return NextResponse.json({ error: "Selecione ao menos 2 mesas" }, { status: 400 });
  if (!nome?.trim()) return NextResponse.json({ error: "Informe o nome do grupo/cliente" }, { status: 400 });

  // Verificar conflitos
  const gruposExistentes = await GrupoMesas.find({ ativo: true, mesas: { $in: mesaIds } });
  if (gruposExistentes.length > 0) return NextResponse.json({ error: "Uma ou mais mesas já estão em um grupo" }, { status: 400 });

  const comandasAbertas = await Comanda.find({ status: "aberta", mesa: { $in: mesaIds } });
  if (comandasAbertas.length > 0) return NextResponse.json({ error: "Uma ou mais mesas já possuem comanda aberta" }, { status: 400 });

  // Criar comanda para o grupo
  const comanda = await Comanda.create({ nome: nome.trim(), status: "aberta", abertaEm: new Date() });
  await Comanda.findByIdAndUpdate(comanda._id, { grupo: null }); // will be set after group creation

  // Criar grupo
  const grupo = await GrupoMesas.create({ mesas: mesaIds, comanda: comanda._id, ativo: true });

  // Vincular comanda e mesas ao grupo
  await Comanda.findByIdAndUpdate(comanda._id, { grupo: grupo._id });
  await Mesa.updateMany({ _id: { $in: mesaIds } }, {});

  return NextResponse.json({ data: { grupo, comanda } }, { status: 201 });
}
