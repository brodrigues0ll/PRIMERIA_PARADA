import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Cliente from "@/lib/models/Cliente";
import PagamentoCliente from "@/lib/models/PagamentoCliente";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { valor, pedidos_quitados, observacao } = body;

  if (!valor || Number(valor) <= 0)
    return NextResponse.json({ error: "Valor deve ser maior que zero" }, { status: 400 });

  await connectDB();

  const cliente = await Cliente.findById(params.id).lean();
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const pagamento = await PagamentoCliente.create({
    cliente: params.id,
    valor: Number(valor),
    pedidos_quitados: pedidos_quitados || [],
    observacao: observacao || "",
  });

  return NextResponse.json({ data: pagamento }, { status: 201 });
}
