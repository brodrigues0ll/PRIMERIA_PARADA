import Link from "next/link";
import { ClipboardList, UtensilsCrossed, ChevronRight, Clock, TrendingUp, Package, AlertTriangle, ScanBarcode, Settings } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Comanda from "@/lib/models/Comanda";
import Pedido from "@/lib/models/Pedido";
import Produto from "@/lib/models/Produto";
import { formatPrice } from "@/lib/utils";

async function getStats() {
  try {
    await connectDB();

    const abertas = await Comanda.countDocuments({ status: "aberta" });

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

    return { abertas, todayOrders, revenue, lowStockCount };
  } catch {
    return { abertas: null, todayOrders: null, revenue: null, lowStockCount: 0 };
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const { abertas, todayOrders, revenue, lowStockCount } = await getStats();
  const isAdmin = session?.user?.role === "admin";

  const firstName = session?.user?.name?.split(" ")[0] ?? "Olá";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/50 bg-card/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            Primeira Parada
          </p>
          <h1 className="text-2xl font-bold text-foreground leading-snug">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            O que vamos gerenciar hoje?
          </p>
        </div>
      </div>

      <main className="px-6 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Hoje</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {todayOrders ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              comanda{todayOrders !== 1 ? "s" : ""} fechada{todayOrders !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Receita</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {revenue !== null ? `R$\u00a0${formatPrice(revenue)}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">hoje</p>
          </div>
        </div>

        {/* Nav cards */}
        <div className="space-y-3">

          {/* Comandas */}
          <Link href="/orders" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-primary p-6 transition-all duration-200 active:scale-[0.98]">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -right-4 -bottom-12 h-40 w-40 rounded-full bg-black/10 pointer-events-none" />
              <div className="absolute left-1/2 top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              <div className="relative flex items-center justify-between">
                <div>
                  <div className="mb-4 h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20">
                    <ClipboardList className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <p className="text-lg font-bold text-primary-foreground">Comandas</p>
                  <div className="flex items-center gap-2 mt-1">
                    {abertas !== null && abertas > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium text-primary-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {abertas} aberta{abertas !== 1 ? "s" : ""}
                      </span>
                    )}
                    {(abertas === 0 || abertas === null) && (
                      <p className="text-sm text-primary-foreground/70">Abertas e fechadas</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary-foreground/60 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* PDV */}
          <Link href="/pdv" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 transition-all duration-200 hover:bg-accent active:scale-[0.98] flex items-center justify-between">
              <div>
                <div className="mb-3 h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <ScanBarcode className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">PDV</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ponto de venda</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Configurações — apenas admin */}
          {isAdmin && (
            <Link href="/configuracoes" className="block group">
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 transition-all duration-200 hover:bg-accent active:scale-[0.98] flex items-center justify-between">
                <div>
                  <div className="mb-3 h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Configurações</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Empresa, equipe e perfil</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}

          {/* Cardápio + Estoque lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/price-table" className="block group">
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.98] h-full">
                <div className="mb-3 h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">Cardápio</p>
                <p className="text-xs text-muted-foreground mt-0.5">Produtos e preços</p>
              </div>
            </Link>

            <Link href="/estoque" className="block group">
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 transition-all duration-200 hover:bg-accent active:scale-[0.98] h-full">
                <div className="mb-3 h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
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
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="pt-2 pb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Ações rápidas
          </p>
          <div className="flex gap-2">
            <Link
              href="/orders"
              className="flex-1 text-center py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors"
            >
              Nova Comanda
            </Link>
            <Link
              href="/orders/fechadas"
              className="flex-1 text-center py-3 px-4 rounded-xl border border-border hover:bg-accent text-foreground text-sm font-medium transition-colors"
            >
              Fechadas
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
