"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const PERFIL_LABEL = { avista: "À vista", semanal: "Semanal", mensal: "Mensal" };
const PERFIL_CLASS = {
  avista: "bg-muted text-muted-foreground",
  semanal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  mensal: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [apenasAtivos, setApenasAtivos] = useState(true);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca.trim()) params.set("q", busca.trim());
      if (apenasAtivos) params.set("ativo", "true");
      const res = await fetch(`/api/clientes?${params}`);
      const json = await res.json();
      if (res.ok) setClientes(json.data || []);
    } catch {
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }, [busca, apenasAtivos]);

  useEffect(() => {
    const timer = setTimeout(() => fetchClientes(), busca ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchClientes, busca]);

  return (
    <>
      <div data-id="clientes-header" className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            data-id="clientes-search-input"
            placeholder="Buscar por nome ou telefone..."
            className="pl-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div data-id="clientes-filter-toggle" className="flex rounded-xl border border-border overflow-hidden h-9">
          {[{ label: "Ativos", value: true }, { label: "Todos", value: false }].map((opt) => (
            <button
              key={String(opt.value)}
              data-id={`clientes-filter-${opt.value ? "ativos" : "todos"}`}
              onClick={() => setApenasAtivos(opt.value)}
              className={cn(
                "flex-1 text-xs font-medium transition-colors",
                apenasAtivos === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div data-id="clientes-page" className="pb-28">
        {loading && (
          <div className="mx-4 mt-4 rounded-2xl border border-border overflow-hidden bg-card">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                {i < 4 && <Separator />}
              </div>
            ))}
          </div>
        )}

        {!loading && clientes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Nenhum cliente encontrado</p>
            <p className="text-xs text-muted-foreground">
              {busca ? "Tente outro nome ou telefone" : "Toque no + para cadastrar"}
            </p>
          </div>
        )}

        {!loading && clientes.length > 0 && (
          <div className="px-4 pt-4">
            <p className="text-xs text-muted-foreground px-1 mb-2">
              {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
            </p>
            <div data-id="clientes-list" className="rounded-2xl border border-border bg-card overflow-hidden">
              {clientes.map((c, i) => (
                <div key={c._id} data-id={`cliente-item-${c._id}`}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors text-left"
                    onClick={() => router.push(`/clientes/${c._id}`)}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-base font-bold text-primary">
                      {c.nome[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.nome}</p>
                      {c.telefone && (
                        <p className="text-xs text-muted-foreground">{c.telefone}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", PERFIL_CLASS[c.perfil_pagamento])}
                      >
                        {PERFIL_LABEL[c.perfil_pagamento] || c.perfil_pagamento}
                      </Badge>
                      {c.saldo_em_aberto > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                          <AlertTriangle className="h-3 w-3" />
                          R$ {formatPrice(c.saldo_em_aberto)}
                        </span>
                      )}
                    </div>
                  </button>
                  {i < clientes.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-5 z-30">
        <Button
          data-id="add-cliente-button"
          size="icon"
          className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          onClick={() => router.push("/clientes/novo")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
