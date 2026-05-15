"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react";
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
import { cn } from "@/lib/utils";

const TIPOS = [
  { key: "entrada", label: "Entrada", icon: ArrowUpCircle, color: "text-emerald-500" },
  { key: "saida", label: "Saída", icon: ArrowDownCircle, color: "text-rose-500" },
  { key: "ajuste", label: "Ajuste", icon: SlidersHorizontal, color: "text-amber-500" },
];

export default function EstoqueMovimentoModal({ open, onClose, item, onSuccess }) {
  const [tipo, setTipo] = useState("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setTipo("entrada"); setQuantidade(""); setObservacao(""); }
  }, [open]);

  const atual = item?.estoque?.quantidade ?? 0;
  const qty = Number(quantidade);
  const previewNovo =
    !isNaN(qty) && qty >= 0
      ? tipo === "entrada" ? atual + qty
      : tipo === "saida" ? Math.max(0, atual - qty)
      : qty
      : null;

  async function handleSave() {
    const qty = Number(quantidade);
    if (isNaN(qty) || qty < 0) { toast.error("Quantidade inválida"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/estoque/${item._id}/movimento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, quantidade: qty, observacao }),
      });
      if (!res.ok) { toast.error("Erro ao salvar"); return; }
      toast.success("Estoque atualizado");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="truncate">{item?.nome}</DialogTitle>
          <DialogDescription>
            Estoque atual:{" "}
            <span className="font-semibold text-foreground">{atual} un.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Seletor de tipo */}
          <div className="grid grid-cols-3 gap-1.5 bg-muted rounded-xl p-1">
            {TIPOS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => setTipo(key)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-colors",
                  tipo === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", tipo === key ? color : "")} />
                {label}
              </button>
            ))}
          </div>

          {/* Quantidade */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qty">
              {tipo === "ajuste" ? "Nova quantidade" : "Quantidade"}
            </Label>
            <Input
              id="qty"
              type="number"
              inputMode="numeric"
              min="0"
              className="bg-background border-border h-12 text-lg font-semibold text-center"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Preview */}
          {previewNovo !== null && quantidade !== "" && (
            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-sm text-muted-foreground">Novo estoque</span>
              <span className="text-sm font-bold text-foreground">{previewNovo} un.</span>
            </div>
          )}

          {/* Observação */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="obs" className="text-muted-foreground">
              Observação <span className="text-xs">(opcional)</span>
            </Label>
            <Input
              id="obs"
              className="bg-background border-border"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: recebimento de fornecedor"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleSave}
              disabled={loading || quantidade === ""}
            >
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
