import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { EstoqueLocal, Produto } from "@/lib/models";

export async function GET() {
  const { error } = await requirePermission("estoque");
  if (error) return error;

  await connectDB();

  const itens = await EstoqueLocal.find()
    .populate("produto", "nome precoVenda precoCompra unidade codigo")
    .lean();

  const zerados = [];
  const abaixoMinimo = [];
  const normal = [];

  let valorTotalCusto = 0;
  let valorTotalVenda = 0;

  for (const item of itens) {
    if (!item.produto) continue;
    const { quantidade, minimo, produto } = item;
    const custoUnitario = produto.precoCompra ?? 0;
    const vendaUnitario = produto.precoVenda ?? 0;

    valorTotalCusto += custoUnitario * quantidade;
    valorTotalVenda += vendaUnitario * quantidade;

    const entry = {
      produtoId: produto._id,
      nome: produto.nome,
      codigo: produto.codigo ?? null,
      unidade: produto.unidade ?? "un",
      quantidade,
      minimo,
      precoCompra: custoUnitario,
      precoVenda: vendaUnitario,
      valorCusto: custoUnitario * quantidade,
    };

    if (quantidade === 0) {
      zerados.push(entry);
    } else if (minimo > 0 && quantidade <= minimo) {
      abaixoMinimo.push(entry);
    } else {
      normal.push(entry);
    }
  }

  // Ordenação: por quantidade crescente dentro de cada grupo
  const sortQty = (a, b) => a.quantidade - b.quantidade;
  zerados.sort((a, b) => a.nome.localeCompare(b.nome));
  abaixoMinimo.sort(sortQty);
  normal.sort(sortQty);

  return NextResponse.json({
    data: {
      resumo: {
        total: itens.length,
        zerados: zerados.length,
        abaixoMinimo: abaixoMinimo.length,
        normal: normal.length,
        valorTotalCusto,
        valorTotalVenda,
      },
      zerados,
      abaixoMinimo,
      normal,
    },
  });
}
