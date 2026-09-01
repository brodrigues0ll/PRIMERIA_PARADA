import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import SalaoLayout from "@/lib/models/SalaoLayout";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();

  const layout = await SalaoLayout.findOne().lean();
  return NextResponse.json({ data: layout ?? { linhas: [] } });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  await connectDB();

  const { linhas } = await request.json();
  const layout = await SalaoLayout.findOneAndUpdate(
    {},
    { linhas: linhas ?? [] },
    { upsert: true, new: true }
  );
  return NextResponse.json({ data: layout });
}
