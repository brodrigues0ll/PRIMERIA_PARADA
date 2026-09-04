import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import WaConfig from "@/lib/models/WaConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const cfg = await WaConfig.findOne({}).lean();
  return NextResponse.json({
    colorLabels: cfg?.colorLabels || {},
    resetHorario: cfg?.resetHorario ?? null,
    lastResetAt: cfg?.lastResetAt ?? null,
  });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const body = await request.json();

  const $set = {};
  if (body.colorLabels !== undefined) $set.colorLabels = body.colorLabels;
  if ("resetHorario" in body) $set.resetHorario = body.resetHorario ?? null;

  // strict: false garante que campos novos não sejam descartados pelo Mongoose
  const cfg = await WaConfig.findOneAndUpdate(
    {},
    { $set },
    { upsert: true, new: true, setDefaultsOnInsert: true, strict: false }
  );
  return NextResponse.json({
    colorLabels: cfg.colorLabels || {},
    resetHorario: cfg.resetHorario ?? null,
    lastResetAt: cfg.lastResetAt ?? null,
  });
}
