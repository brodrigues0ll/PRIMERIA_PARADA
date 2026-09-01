import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import EstoqueLocal from "@/lib/models/EstoqueLocal";
import LocalEstoque from "@/lib/models/LocalEstoque";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const localId = searchParams.get("localId");

  if (localId) {
    // Return estoque for a specific local with product details
    const registros = await EstoqueLocal.find({ local: localId })
      .populate("produto", "nome codigo precoCompra precoVenda imagem minimo")
      .sort({ "produto.nome": 1 });
    return NextResponse.json({ data: registros });
  }

  // Consolidated view: list products with total quantity and breakdown by local
  const locais = await LocalEstoque.find({ ativo: true }).sort({ ordem: 1, nome: 1 });
  const registros = await EstoqueLocal.find({})
    .populate("produto", "nome codigo precoCompra precoVenda imagem minimo quantidade")
    .populate("local", "nome tipo");

  // Group by product
  const map = new Map();
  for (const r of registros) {
    if (!r.produto) continue;
    const pid = r.produto._id.toString();
    if (!map.has(pid)) {
      map.set(pid, {
        produto: r.produto,
        quantidadeTotal: 0,
        porLocal: [],
      });
    }
    const entry = map.get(pid);
    entry.quantidadeTotal += r.quantidade;
    entry.porLocal.push({ local: r.local, quantidade: r.quantidade, minimo: r.minimo });
  }

  const consolidated = Array.from(map.values()).sort((a, b) =>
    a.produto.nome.localeCompare(b.produto.nome, "pt-BR")
  );

  return NextResponse.json({ data: consolidated, locais });
}
