import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import WaConfig from "@/lib/models/WaConfig";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const cfg = await WaConfig.findOne({}).lean();
  return NextResponse.json({ colorLabels: cfg?.colorLabels || {} });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const body = await request.json();
  const cfg = await WaConfig.findOneAndUpdate(
    {},
    { $set: { colorLabels: body.colorLabels ?? {} } },
    { upsert: true, new: true }
  );
  return NextResponse.json({ colorLabels: cfg.colorLabels || {} });
}
