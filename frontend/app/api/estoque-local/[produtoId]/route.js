import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import EstoqueLocal from "@/lib/models/EstoqueLocal";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const { produtoId } = await params;
  const registros = await EstoqueLocal.find({ produto: produtoId })
    .populate("local", "nome tipo ativo");
  return NextResponse.json({ data: registros });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const { produtoId } = await params;
  const { localId, quantidade, minimo } = await req.json();
  if (!localId || quantidade === undefined || quantidade < 0)
    return NextResponse.json({ error: "localId e quantidade são obrigatórios" }, { status: 400 });

  const update = { quantidade };
  if (minimo !== undefined) update.minimo = minimo;

  const registro = await EstoqueLocal.findOneAndUpdate(
    { produto: produtoId, local: localId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate("local", "nome tipo");

  return NextResponse.json({ data: registro });
}
