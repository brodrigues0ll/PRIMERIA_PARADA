import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Cliente from "@/lib/models/Cliente";
import PedidoDelivery from "@/lib/models/PedidoDelivery";
import PagamentoCliente from "@/lib/models/PagamentoCliente";

async function calcularSaldoEmAberto(clienteId) {
  const pedidosNaConta = await PedidoDelivery.find({
    cliente: clienteId,
    na_conta: true,
    status: { $ne: "cancelado" },
  })
    .select("_id total")
    .lean();

  if (pedidosNaConta.length === 0) return 0;

  const idsPedidos = pedidosNaConta.map((p) => p._id);

  const pagamentos = await PagamentoCliente.find({
    cliente: clienteId,
    pedidos_quitados: { $in: idsPedidos },
  })
    .select("pedidos_quitados")
    .lean();

  const idsQuitados = new Set(
    pagamentos.flatMap((pg) => pg.pedidos_quitados.map((id) => id.toString()))
  );

  const saldo = pedidosNaConta
    .filter((p) => !idsQuitados.has(p._id.toString()))
    .reduce((acc, p) => acc + p.total, 0);

  return saldo;
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const ativoParam = searchParams.get("ativo");

  const filtro = {};

  const ativo = ativoParam === "false" ? false : true;
  filtro.ativo = ativo;

  if (q?.trim()) {
    const regex = new RegExp(q.trim(), "i");
    filtro.$or = [{ nome: regex }, { telefone: regex }];
  }

  const clientes = await Cliente.find(filtro).sort({ nome: 1 }).lean();

  const clientesComSaldo = await Promise.all(
    clientes.map(async (cliente) => ({
      ...cliente,
      saldo_em_aberto: await calcularSaldoEmAberto(cliente._id),
    }))
  );

  return NextResponse.json({ data: clientesComSaldo });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { nome, telefone, enderecos, perfil_pagamento, observacoes } = body;

  if (!nome?.trim())
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  await connectDB();

  const cliente = await Cliente.create({
    nome: nome.trim(),
    telefone: telefone?.trim() || "",
    enderecos: enderecos || [],
    perfil_pagamento: perfil_pagamento || "avista",
    observacoes: observacoes || "",
  });

  return NextResponse.json({ data: cliente }, { status: 201 });
}
