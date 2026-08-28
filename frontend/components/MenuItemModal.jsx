"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

export default function MenuItemModal({ open, onClose, item, onSuccess }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isEdit = !!item;

  useEffect(() => {
    if (item) {
      setNome(item.nome || "");
      setPreco(String(item.preco || "").replace(".", ","));
      setCodigo(item.codigo || "");
    } else {
      setNome(""); setPreco(""); setCodigo("");
    }
  }, [item, open]);

  async function handleSave() {
    if (!nome.trim() || !preco) return;
    const precoNum = parseFloat(preco.replace(",", "."));
    if (isNaN(precoNum) || precoNum < 0) { toast.error("Preço inválido"); return; }
    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/cardapio/${item._id}` : "/api/cardapio", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), preco: precoNum, codigo: codigo.trim() }),
      });
      if (!res.ok) { toast.error("Erro ao salvar"); return; }
      toast.success(isEdit ? "Item atualizado" : "Item criado");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    setDeleting(true);
    try {
      await fetch(`/api/cardapio/${item._id}`, { method: "DELETE" });
      toast.success("Item removido");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Erro ao deletar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar item" : "Novo item"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize as informações" : "Adicione ao cardápio"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              className="bg-background border-input"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome-item">Nome *</Label>
            <Input
              id="nome-item"
              className="bg-background border-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Coca-Cola Lata"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preco">Preço (R$) *</Label>
            <Input
              id="preco"
              className="bg-background border-input"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              required
            />
          </div>
          {isEdit && <Separator />}
          <div className="flex gap-2">
            {isEdit && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleSave}
              disabled={loading || !nome.trim() || !preco}
            >
              {loading ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
