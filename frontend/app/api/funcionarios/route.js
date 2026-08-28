import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const users = await User.find({}).populate("permissionGroup", "nome").select("-password").sort({ createdAt: 1 });
  return NextResponse.json(users);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const { name, email, password, role, cargo, permissionGroup, ativo } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
  }

  const exists = await User.findOne({ email });
  if (exists) return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: role ?? "employee",
    cargo: cargo ?? "",
    permissionGroup: permissionGroup ?? null,
    ativo: ativo ?? true,
  });

  const { password: _, ...safe } = user.toObject();
  return NextResponse.json(safe, { status: 201 });
}
