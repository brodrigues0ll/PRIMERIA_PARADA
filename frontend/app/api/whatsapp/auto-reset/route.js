import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WaConfig from "@/lib/models/WaConfig";

/**
 * GET /api/whatsapp/auto-reset?key=CRON_SECRET
 *
 * Chamado pelo container cron a cada minuto.
 * Verifica se o horário atual bate com WaConfig.resetHorario e,
 * se já não foi resetado hoje, atualiza lastResetAt.
 * O frontend lê lastResetAt e limpa o IndexedDB automaticamente.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || key !== cronSecret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await connectDB();

  const cfg = await WaConfig.findOne({}).lean();
  if (!cfg?.resetHorario) {
    return NextResponse.json({ skipped: true, reason: "reset_horario_not_set" });
  }

  const now = new Date();
  // Sempre compara no fuso de São Paulo, independente do TZ do container
  const currentHHMM = now.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).slice(0, 5);

  if (currentHHMM !== cfg.resetHorario) {
    return NextResponse.json({ skipped: true, reason: "not_time_yet", current: currentHHMM, scheduled: cfg.resetHorario });
  }

  // Verificar se já foi resetado nos últimos 5 minutos (evitar duplicatas)
  if (cfg.lastResetAt) {
    const diffMs = now.getTime() - new Date(cfg.lastResetAt).getTime();
    if (diffMs < 5 * 60 * 1000) {
      return NextResponse.json({ skipped: true, reason: "already_reset_recently" });
    }
  }

  await WaConfig.findOneAndUpdate(
    {},
    { $set: { lastResetAt: now, chatColors: {} } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, resetAt: now.toISOString() });
}
