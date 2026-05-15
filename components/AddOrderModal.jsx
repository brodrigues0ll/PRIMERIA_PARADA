"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";
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

export default function AddOrderModal({ open, onClose }) {
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    if (!nome.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/comandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao criar comanda"); return; }
      setNome("");
      onClose();
      router.push(`/orders/${data.data._id}`);
    } catch {
      toast.error("Erro ao criar comanda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setNome(""); onClose(); } }}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova comanda</DialogTitle>
          <DialogDescription>Informe o nome do cliente ou mesa</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome-comanda">Cliente / Mesa</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="nome-comanda"
                className="pl-9 bg-background border-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Mesa 4, João..."
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setNome(""); onClose(); }}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleCreate}
              disabled={loading || !nome.trim()}
            >
              {loading ? "Criando..." : "Criar comanda"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
