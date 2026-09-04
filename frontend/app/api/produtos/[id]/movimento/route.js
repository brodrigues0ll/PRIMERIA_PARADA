import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Produto from "@/lib/models/Produto";
import MovimentoEstoque from "@/lib/models/MovimentoEstoque";
import MenuItem from "@/lib/models/MenuItem";
import CardapioDoDia from "@/lib/models/CardapioDoDia";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const { tipo, quantidade, observacao, fornecedor } = await req.json();

  if (!["entrada", "saida", "ajuste"].includes(tipo))
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

  const qty = Math.round(Number(quantidade));
  if (isNaN(qty) || qty < 0)
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });

  await connectDB();

  const produto = await Produto.findById(id);
  if (!produto) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const anterior = produto.quantidade;
  let nova;
  if (tipo === "entrada") nova = anterior + qty;
  else if (tipo === "saida") nova = Math.max(0, anterior - qty);
  else nova = qty;

  produto.quantidade = nova;
  await produto.save();

  await MovimentoEstoque.create({
    produto: id,
    tipo,
    quantidade: qty,
    quantidadeAnterior: anterior,
    quantidadeNova: nova,
    observacao: observacao?.trim() ?? "",
    fornecedor: tipo === "entrada" && fornecedor ? fornecedor : null,
  });

  // 6.7 — Auto-marcar esgotado no CardapioDoDia se quantidade zerou
  if (nova === 0 && (tipo === "saida" || tipo === "ajuste")) {
    try {
      const menuItems = await MenuItem.find({ produtoRef: id, ativo: true }).select("_id").lean();
      if (menuItems.length > 0) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const menuItemIds = menuItems.map((m) => m._id);
        await CardapioDoDia.updateOne(
          { data: hoje, "itens.menuItem": { $in: menuItemIds } },
          { $set: { "itens.$[el].nivel": "esgotado" } },
          { arrayFilters: [{ "el.menuItem": { $in: menuItemIds } }] }
        );
      }
    } catch {
      // Não interrompe a operação principal
    }
  }

  return NextResponse.json({ data: produto });
}
