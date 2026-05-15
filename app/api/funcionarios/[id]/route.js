import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const user = await User.findById(id).populate("permissionGroup", "nome").select("-password");
  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "email", "role", "cargo", "permissionGroup", "ativo", "foto"];
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  if (update.email) {
    const exists = await User.findOne({ email: update.email, _id: { $ne: id } });
    if (exists) return NextResponse.json({ error: "Email já em uso" }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(id, update, { new: true })
    .populate("permissionGroup", "nome")
    .select("-password");
  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Não é possível excluir a si mesmo" }, { status: 400 });
  }

  await User.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
