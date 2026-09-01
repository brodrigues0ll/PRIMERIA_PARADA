import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import MembroFamiliar from "@/lib/models/MembroFamiliar";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { id } = await params;
  const body = await request.json();

  const membro = await MembroFamiliar.findById(id);
  if (!membro) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  if (body.nome !== undefined) membro.nome = body.nome.trim();
  if (body.ativo !== undefined) membro.ativo = body.ativo;

  await membro.save();

  return NextResponse.json({ data: membro });
}
