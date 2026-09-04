import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AuditLog from "@/lib/models/AuditLog";
import { getAuthSession } from "@/lib/auth";

export async function GET(req) {
  const { session, error } = await getAuthSession();
  if (error) return error;
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
  const acao = searchParams.get("acao") ?? "";
  const entidade = searchParams.get("entidade") ?? "";
  const usuario = searchParams.get("usuario") ?? "";
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  await connectDB();

  const filter = {};
  if (acao) filter.acao = { $regex: acao, $options: "i" };
  if (entidade) filter.entidade = entidade;
  if (usuario) filter.usuario = usuario;
  if (dataInicio || dataFim) {
    filter.createdAt = {};
    if (dataInicio) filter.createdAt.$gte = new Date(dataInicio);
    if (dataFim) {
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = fim;
    }
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("usuario", "name email")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
