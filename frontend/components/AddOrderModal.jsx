"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AddOrderModal({ open, onClose }) {
  const [nome, setNome] = useState("");
  const [mesasLivres, setMesasLivres] = useState([]);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [mesaSelecionada, setMesaSelecionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) { setNome(""); setMesaSelecionada(null); return; }
    setLoadingMesas(true);
    fetch("/api/salao")
      .then((r) => r.json())
      .then((d) => {
        const livres = (d.data ?? []).filter((m) => m.status === "livre");
        setMesasLivres(livres);
      })
      .catch(() => toast.error("Erro ao carregar mesas"))
      .finally(() => setLoadingMesas(false));
  }, [open]);

  async function handleCreate() {
    const nomeEnviado = nome.trim() || mesaSelecionada?.mesa.nome || "Avulso";
    setLoading(true);
    try {
      const res = await fetch("/api/comandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeEnviado,
          mesaId: mesaSelecionada?.mesa._id ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao criar comanda"); return; }
      setNome("");
      setMesaSelecionada(null);
      onClose();
      router.push(`/orders/${data.data._id}`);
    } catch {
      toast.error("Erro ao criar comanda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setNome(""); setMesaSelecionada(null); onClose(); } }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova comanda</DialogTitle>
          <DialogDescription>Selecione a mesa e informe o cliente</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Seleção de mesa */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Mesa{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            {loadingMesas ? (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-xl" />
                ))}
              </div>
            ) : mesasLivres.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">
                Nenhuma mesa livre no momento
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mesasLivres.map((item) => {
                  const selected = mesaSelecionada?.mesa._id === item.mesa._id;
                  return (
                    <button
                      key={item.mesa._id}
                      type="button"
                      onClick={() =>
                        setMesaSelecionada(selected ? null : item)
                      }
                      className={cn(
                        "py-2 px-3 rounded-xl border text-sm font-medium transition-colors text-center",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:bg-accent"
                      )}
                    >
                      {item.mesa.nome}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nome do cliente */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome-comanda">
              Cliente{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="nome-comanda"
              className="bg-background border-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={
                mesaSelecionada ? mesaSelecionada.mesa.nome : "Nome do cliente..."
              }
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setNome("");
                setMesaSelecionada(null);
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar comanda"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
