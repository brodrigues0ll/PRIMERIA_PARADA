import Link from "next/link";
import {
  ClipboardList,
  UtensilsCrossed,
  Clock,
  TrendingUp,
  Package,
  AlertTriangle,
  ScanBarcode,
  Settings,
  Truck,
  Users,
  LayoutGrid,
  Wallet,
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Comanda from "@/lib/models/Comanda";
import Mesa from "@/lib/models/Mesa";
import Pedido from "@/lib/models/Pedido";
import Produto from "@/lib/models/Produto";
import PedidoDelivery from "@/lib/models/PedidoDelivery";
import Cliente from "@/lib/models/Cliente";
import { formatPrice } from "@/lib/utils";

async function getStats() {
  try {
    await connectDB();

    const abertas = await Comanda.countDocuments({ status: "aberta" });
    const mesasOcupadas = await Comanda.countDocuments({ status: "aberta", mesa: { $ne: null } });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayClosed = await Comanda.find({
      status: "fechada",
      fechadaEm: { $gte: startOfDay },
    }).select("_id");

    const ids = todayClosed.map((c) => c._id);

    const revenueAgg = await Pedido.aggregate([
      { $match: { comanda: { $in: ids } } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$preco", "$quantidade"] } } } },
    ]);

    const lowStockCount = await Produto.countDocuments({
      $expr: { $and: [{ $gt: ["$minimo", 0] }, { $lte: ["$quantidade", "$minimo"] }] },
    });

    const todayOrders = ids.length;
    const revenue = revenueAgg[0]?.total ?? 0;

    const deliveryHoje = await PedidoDelivery.countDocuments({
      createdAt: { $gte: startOfDay },
      status: { $ne: "cancelado" },
    });

    const deliveryAtivos = await PedidoDelivery.countDocuments({
      createdAt: { $gte: startOfDay },
      status: { $in: ["recebido", "em_preparo"] },
    });

    const clientesComSaldo = await Cliente.aggregate([
      { $lookup: { from: "pedidodeliveries", localField: "_id", foreignField: "cliente", as: "pedidos" } },
      { $lookup: { from: "pagamentoclientes", localField: "_id", foreignField: "cliente", as: "pagamentos" } },
      {
        $project: {
          totalPedidos: { $sum: "$pedidos.total" },
          totalPago: { $sum: "$pagamentos.valor" },
        },
      },
      { $addFields: { saldo: { $subtract: ["$totalPedidos", "$totalPago"] } } },
      { $match: { saldo: { $gt: 0 } } },
      { $count: "total" },
    ]);

    const clientesDevedores = clientesComSaldo[0]?.total ?? 0;

    return { abertas, todayOrders, revenue, lowStockCount, deliveryHoje, deliveryAtivos, clientesDevedores, mesasOcupadas };
  } catch {
    return { abertas: null, todayOrders: null, revenue: null, lowStockCount: 0, deliveryHoje: null, deliveryAtivos: 0, clientesDevedores: null, mesasOcupadas: 0 };
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const { abertas, todayOrders, revenue, lowStockCount, deliveryHoje, deliveryAtivos, clientesDevedores, mesasOcupadas } = await getStats();
  const isAdmin = session?.user?.role === "admin";

  const firstName = session?.user?.name?.split(" ")[0] ?? "Olá";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">

      {/* Hero compacto */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-0.5">Primeira Parada</p>
        <h1 className="text-xl font-bold text-foreground">{greeting}, {firstName}</h1>
      </div>

      {/* Stats */}
      <div className="px-4 mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{todayOrders ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">comanda{todayOrders !== 1 ? "s" : ""} hoje</p>
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">
              {revenue !== null ? `R$\u00a0${formatPrice(revenue)}` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">receita hoje</p>
          </div>
        </div>
      </div>

      {/* Grid de funcionalidades */}
      <div className="px-4 pb-10 grid grid-cols-2 sm:grid-cols-3 gap-3">

        {/* Comandas — destaque */}
        <Link href="/orders" className="col-span-2 sm:col-span-3 group">
          <div className="relative overflow-hidden rounded-2xl bg-primary p-5 transition-all duration-200 active:scale-[0.98] flex items-center justify-between">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -right-2 -bottom-8 h-32 w-32 rounded-full bg-black/10 pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 shrink-0">
                <ClipboardList className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-bold text-primary-foreground">Comandas</p>
                {abertas !== null && abertas > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-foreground/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    {abertas} aberta{abertas !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <p className="text-xs text-primary-foreground/70">Abertas e fechadas</p>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Salão */}
        <Link href="/salao" className="group">
          <div className="rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.97] h-full flex flex-col">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Salão</p>
            {mesasOcupadas > 0 ? (
              <p className="text-xs text-rose-500 font-medium mt-0.5">{mesasOcupadas} mesa{mesasOcupadas !== 1 ? "s" : ""} ocupada{mesasOcupadas !== 1 ? "s" : ""}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Mapa do salão</p>
            )}
          </div>
        </Link>

        {/* Delivery */}
        <Link href="/delivery" className="group">
          <div className="rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.97] h-full flex flex-col">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Truck className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Delivery</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-muted-foreground">
                {deliveryHoje !== null ? `${deliveryHoje} hoje` : "Pedidos"}
              </p>
              {deliveryAtivos > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {deliveryAtivos}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Clientes */}
        <Link href="/clientes" className="group">
          <div className="rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.97] h-full flex flex-col">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Clientes</p>
            {clientesDevedores !== null && clientesDevedores > 0 ? (
              <p className="text-xs text-amber-500 font-medium mt-0.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {clientesDevedores} em aberto
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Cadastro e contas</p>
            )}
          </div>
        </Link>

        {/* PDV */}
        <Link href="/pdv" className="group">
          <div className="rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.97] h-full flex flex-col">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <ScanBarcode className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">PDV</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ponto de venda</p>
          </div>
        </Link>

        {/* Cardápio */}
        <Link href="/price-table" className="group">
          <div className="rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.97] h-full flex flex-col">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Cardápio</p>
            <p className="text-xs text-muted-foreground mt-0.5">Produtos e preços</p>
          </div>
        </Link>

        {/* Estoque */}
        <Link href="/estoque" className="group">
          <div className="rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.97] h-full flex flex-col">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Estoque</p>
            {lowStockCount > 0 ? (
              <p className="text-xs text-amber-500 font-medium mt-0.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {lowStockCount} baixo{lowStockCount !== 1 ? "s" : ""}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Controle</p>
            )}
          </div>
        </Link>

        {/* WhatsApp */}
        <Link href="/whatsapp" className="group col-span-2 sm:col-span-1">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 transition-all duration-200 hover:bg-emerald-500/20 active:scale-[0.97] h-full flex flex-col">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
              <WhatsAppIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">WhatsApp</p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">Conversas</p>
          </div>
        </Link>

        {/* Financeiro */}
        <Link href="/financeiro" className="group">
          <div className="rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.97] h-full flex flex-col">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Financeiro</p>
            <p className="text-xs text-muted-foreground mt-0.5">Caixa e contas</p>
          </div>
        </Link>

        {/* Configurações — apenas admin */}
        {isAdmin && (
          <Link href="/configuracoes" className="group">
            <div className="rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.97] h-full flex flex-col">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-foreground">Configurações</p>
              <p className="text-xs text-muted-foreground mt-0.5">Empresa e equipe</p>
            </div>
          </Link>
        )}

      </div>
    </div>
  );
}
