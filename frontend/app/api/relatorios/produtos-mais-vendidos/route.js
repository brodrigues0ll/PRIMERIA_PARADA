import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { Pedido, PedidoDelivery, Comanda } from "@/lib/models";

export async function GET(request) {
  const { error } = await requirePermission("financeiro.relatorios");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const inicioParam = searchParams.get("inicio");
  const fimParam = searchParams.get("fim");
  const limite = Math.min(parseInt(searchParams.get("limite") ?? "10"), 50);

  if (!inicioParam || !fimParam) {
    return NextResponse.json({ error: "Parâmetros inicio e fim são obrigatórios" }, { status: 400 });
  }

  const inicio = new Date(inicioParam);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(fimParam);
  fim.setHours(23, 59, 59, 999);

  await connectDB();

  // Busca comandas fechadas no período para filtrar pedidos
  const comandasFechadas = await Comanda.find({
    status: "fechada",
    fechadaEm: { $gte: inicio, $lte: fim },
  }).select("_id").lean();
  const comandaIds = comandasFechadas.map((c) => c._id);

  // Pedidos de comanda
  const pedidosComanda = await Pedido.aggregate([
    { $match: { comanda: { $in: comandaIds } } },
    {
      $group: {
        _id: "$nome",
        quantidade: { $sum: "$quantidade" },
        receita: { $sum: { $multiply: ["$preco", "$quantidade"] } },
        canal: { $first: "comanda" },
      },
    },
  ]);

  // Pedidos de delivery entregues no período
  const pedidosDelivery = await PedidoDelivery.aggregate([
    {
      $match: {
        status: "entregue",
        updatedAt: { $gte: inicio, $lte: fim },
      },
    },
    { $unwind: "$itens" },
    {
      $group: {
        _id: "$itens.nome",
        quantidade: { $sum: "$itens.quantidade" },
        receita: { $sum: { $multiply: ["$itens.preco", "$itens.quantidade"] } },
      },
    },
  ]);

  // Combina os dois canais
  const mapaGlobal = {};

  for (const p of pedidosComanda) {
    const nome = p._id;
    if (!mapaGlobal[nome]) mapaGlobal[nome] = { nome, quantidade: 0, receita: 0 };
    mapaGlobal[nome].quantidade += p.quantidade;
    mapaGlobal[nome].receita += p.receita;
  }

  for (const p of pedidosDelivery) {
    const nome = p._id;
    if (!mapaGlobal[nome]) mapaGlobal[nome] = { nome, quantidade: 0, receita: 0 };
    mapaGlobal[nome].quantidade += p.quantidade;
    mapaGlobal[nome].receita += p.receita;
  }

  const ranking = Object.values(mapaGlobal)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, limite);

  return NextResponse.json({ data: ranking });
}
