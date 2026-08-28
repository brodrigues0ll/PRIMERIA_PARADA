import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).select("-password");
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { name, email, foto, senhaAtual, novaSenha } = body;

  const update = {};
  if (name !== undefined) update.name = name;
  if (foto !== undefined) update.foto = foto;

  if (email !== undefined && email !== session.user.email) {
    const exists = await User.findOne({ email, _id: { $ne: session.user.id } });
    if (exists) return NextResponse.json({ error: "Email já em uso" }, { status: 400 });
    update.email = email;
  }

  if (novaSenha) {
    if (!senhaAtual) return NextResponse.json({ error: "Informe a senha atual" }, { status: 400 });
    const user = await User.findById(session.user.id).select("+password");
    const valid = await bcrypt.compare(senhaAtual, user.password);
    if (!valid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    update.password = await bcrypt.hash(novaSenha, 12);
  }

  const updated = await User.findByIdAndUpdate(session.user.id, update, { new: true }).select("-password");
  return NextResponse.json(updated);
}
