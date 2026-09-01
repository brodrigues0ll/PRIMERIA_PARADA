import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import LocalEstoque from "@/lib/models/LocalEstoque";
import EstoqueLocal from "@/lib/models/EstoqueLocal";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "admin")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const allowed = ["nome", "tipo", "descricao", "ativo", "ordem"];
  const update = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  try {
    const local = await LocalEstoque.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!local) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 });
    return NextResponse.json({ data: local });
  } catch (err) {
    if (err.code === 11000)
      return NextResponse.json({ error: "Já existe um local com esse nome" }, { status: 409 });
    return NextResponse.json({ error: "Erro ao atualizar local" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "admin")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  // Check if any EstoqueLocal has quantidade > 0 for this local
  const comEstoque = await EstoqueLocal.findOne({ local: id, quantidade: { $gt: 0 } });
  if (comEstoque)
    return NextResponse.json(
      { error: "Não é possível desativar: há produtos com estoque neste local" },
      { status: 409 }
    );
  const local = await LocalEstoque.findByIdAndUpdate(id, { ativo: false }, { new: true });
  if (!local) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 });
  return NextResponse.json({ data: local });
}
