import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import { auditLog, ACOES } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const { novaSenha, senhaAdmin } = await req.json();

  if (!novaSenha || novaSenha.length < 6) {
    return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });
  }

  if (!senhaAdmin) {
    return NextResponse.json({ error: "Confirmação de senha do admin é obrigatória" }, { status: 400 });
  }

  // Valida senha do admin que está realizando a operação
  const adminUser = await User.findById(session.user.id).select("password").lean();
  if (!adminUser) return NextResponse.json({ error: "Admin não encontrado" }, { status: 404 });

  const senhaCorreta = await bcrypt.compare(senhaAdmin, adminUser.password);
  if (!senhaCorreta) {
    return NextResponse.json({ error: "Senha do administrador incorreta" }, { status: 403 });
  }

  const alvo = await User.findById(id).select("nome").lean();
  if (!alvo) return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });

  const hashed = await bcrypt.hash(novaSenha, 12);
  await User.findByIdAndUpdate(id, { password: hashed });

  await auditLog(session, ACOES.SENHA_ALTERAR, "User", id, { nome: alvo.nome });

  return NextResponse.json({ ok: true });
}
