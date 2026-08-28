import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { PermissionGroup } from "@/lib/models";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const groups = await PermissionGroup.find({}).sort({ nome: 1 });
  return NextResponse.json(groups);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const { nome, descricao, permissoes } = await req.json();
  if (!nome) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const group = await PermissionGroup.create({ nome, descricao: descricao ?? "", permissoes: permissoes ?? [] });
  return NextResponse.json(group, { status: 201 });
}
