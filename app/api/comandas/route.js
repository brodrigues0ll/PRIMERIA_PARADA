import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { Comanda } from "@/lib/models";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    await connectDB();

    const filter = status ? { status } : {};
    const sort = status === "fechada" ? { fechadaEm: -1 } : { abertaEm: -1 };

    const comandas = await Comanda.find(filter).sort(sort);

    return NextResponse.json({ data: comandas });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nome } = body;

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome do cliente é obrigatório" }, { status: 400 });
    }

    await connectDB();
    const comanda = await Comanda.create({
      nome: nome.trim(),
      status: "aberta",
      abertaEm: new Date(),
    });

    return NextResponse.json({ data: comanda }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
