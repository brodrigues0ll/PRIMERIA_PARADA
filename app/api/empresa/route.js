import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { Empresa } from "@/lib/models";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const empresa = await Empresa.findOne({});
  if (!empresa) {
    return NextResponse.json({ nome: "Primeira Parada", slogan: "", logo: null, cnpj: "", telefone: "", endereco: "" });
  }
  return NextResponse.json(empresa);
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const allowed = ["nome", "slogan", "logo", "cnpj", "telefone", "endereco"];
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  const empresa = await Empresa.findOneAndUpdate({}, update, { upsert: true, new: true });
  return NextResponse.json(empresa);
}
