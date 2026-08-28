import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { Comanda, Pedido } from "@/lib/models";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const comanda = await Comanda.findById(id);

    if (!comanda) {
      return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
    }

    const pedidos = await Pedido.find({ comanda: id }).populate("menuItem", "nome preco");

    return NextResponse.json({ data: { ...comanda.toObject(), pedidos } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!["fechar", "reabrir"].includes(action)) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    await connectDB();

    const update =
      action === "fechar"
        ? { status: "fechada", fechadaEm: new Date() }
        : { status: "aberta", fechadaEm: null };

    const comanda = await Comanda.findByIdAndUpdate(id, update, { new: true });

    if (!comanda) {
      return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ data: comanda });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
