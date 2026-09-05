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
    chatColors: cfg?.chatColors || {},
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
  if ("chatColors" in body) $set.chatColors = body.chatColors;

  // Atualização de cor individual: { jid, colorKey }
  if (body.jid !== undefined) {
    const jid = body.jid;
    if (body.colorKey === null || body.colorKey === undefined) {
      // Remove a cor deste jid
      const cfg = await WaConfig.findOneAndUpdate(
        {},
        { $unset: { [`chatColors.${jid}`]: "" } },
        { upsert: true, new: true, strict: false }
      );
      return NextResponse.json({ chatColors: cfg?.chatColors || {} });
    } else {
      const cfg = await WaConfig.findOneAndUpdate(
        {},
        { $set: { [`chatColors.${jid}`]: body.colorKey } },
        { upsert: true, new: true, strict: false }
      );
      return NextResponse.json({ chatColors: cfg?.chatColors || {} });
    }
  }

  const cfg = await WaConfig.findOneAndUpdate(
    {},
    { $set },
    { upsert: true, new: true, setDefaultsOnInsert: true, strict: false }
  );
  return NextResponse.json({
    colorLabels: cfg.colorLabels || {},
    resetHorario: cfg.resetHorario ?? null,
    lastResetAt: cfg.lastResetAt ?? null,
    chatColors: cfg.chatColors || {},
  });
}
