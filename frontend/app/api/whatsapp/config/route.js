import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import WaConfig from "@/lib/models/WaConfig";

const DEFAULT_LABELS = {
  red: "Urgente / Problema",
  orange: "Aguardando resposta",
  yellow: "Em atendimento",
  green: "Atendido / Concluído",
  teal: "Retirada no balcão",
  blue: "Delivery saiu",
  purple: "Cliente VIP",
  pink: "Reembolso / Reclamação",
  gray: "Sem prioridade",
  brown: "Fornecedor",
};

async function getOrCreateConfig() {
  let cfg = await WaConfig.findOne({}).lean();
  if (!cfg) {
    cfg = await WaConfig.create({ colorLabels: DEFAULT_LABELS });
    cfg = cfg.toObject();
  }
  return cfg;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const cfg = await getOrCreateConfig();
  return NextResponse.json({ colorLabels: { ...DEFAULT_LABELS, ...(cfg.colorLabels || {}) } });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();
  const body = await request.json();
  const cfg = await WaConfig.findOneAndUpdate(
    {},
    { $set: { colorLabels: body.colorLabels } },
    { upsert: true, new: true }
  );
  return NextResponse.json({ colorLabels: { ...DEFAULT_LABELS, ...(cfg.colorLabels || {}) } });
}
