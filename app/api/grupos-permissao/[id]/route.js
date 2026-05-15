import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { PermissionGroup, User } from "@/lib/models";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const { nome, descricao, permissoes } = await req.json();

  const update = {};
  if (nome !== undefined) update.nome = nome;
  if (descricao !== undefined) update.descricao = descricao;
  if (permissoes !== undefined) update.permissoes = permissoes;

  const group = await PermissionGroup.findByIdAndUpdate(id, update, { new: true });
  if (!group) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(group);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  await User.updateMany({ permissionGroup: id }, { permissionGroup: null });
  await PermissionGroup.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
