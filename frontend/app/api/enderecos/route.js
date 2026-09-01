import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import EnderecoSalvo from "@/lib/models/EnderecoSalvo";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) return NextResponse.json({ data: [] });

  await connectDB();

  const enderecos = await EnderecoSalvo.find({
    rua: { $regex: q, $options: "i" },
  })
    .sort({ usos: -1 })
    .limit(8)
    .lean();

  return NextResponse.json({ data: enderecos });
}
