"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, ToggleRight, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIPOS = [
  { value: "freezer_bebidas", label: "Freezer de Bebidas", icon: "🥤" },
  { value: "freezer_insumos", label: "Freezer de Insumos", icon: "🥩" },
  { value: "despensa", label: "Despensa", icon: "📦" },
  { value: "geladeira", label: "Geladeira", icon: "❄️" },
  { value: "outro", label: "Outro", icon: "📋" },
];

function tipoInfo(tipo) {
  return TIPOS.find((t) => t.value === tipo) || TIPOS[TIPOS.length - 1];
}

export default function EstoqueConfigTab() {
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Form state
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("outro");
  const [descricao, setDescricao] = useState("");
  const [ordem, setOrdem] = useState("");

  const fetchLocais = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/locais-estoque");
      const data = await res.json();
      if (res.ok) setLocais(data.data || []);
      else toast.error("Erro ao carregar locais");
    } catch {
      toast.error("Erro ao carregar locais");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocais(); }, [fetchLocais]);

  function abrirNovo() {
    setEditando(null);
    setNome("");
    setTipo("outro");
    setDescricao("");
    setOrdem("");
    setModalAberto(true);
  }

  function abrirEditar(local) {
    setEditando(local);
    setNome(local.nome);
    setTipo(local.tipo || "outro");
    setDescricao(local.descricao || "");
    setOrdem(local.ordem != null ? String(local.ordem) : "");
    setModalAberto(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      const body = {
        nome: nome.trim(),
        tipo,
        descricao: descricao.trim(),
        ordem: ordem !== "" ? Number(ordem) : 0,
      };
      const res = editando
        ? await fetch(`/api/locais-estoque/${editando._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/locais-estoque", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar local");
        return;
      }
      toast.success(editando ? "Local atualizado!" : "Local criado!");
      setModalAberto(false);
      fetchLocais();
    } catch {
      toast.error("Não foi possível salvar o local");
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleAtivo(local) {
    try {
      if (local.ativo) {
        const res = await fetch(`/api/locais-estoque/${local._id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Erro ao desativar"); return; }
        toast.success("Local desativado");
      } else {
        await fetch(`/api/locais-estoque/${local._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: true }),
        });
        toast.success("Local ativado");
      }
      fetchLocais();
    } catch {
      toast.error("Não foi possível alterar o status do local");
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Locais de Estoque</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure os locais onde os produtos são armazenados
            </p>
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground gap-1.5"
            onClick={abrirNovo}
          >
            <Plus className="h-3.5 w-3.5" />
            Novo local
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : locais.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">Nenhum local cadastrado</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {locais.map((local, idx) => {
              const info = tipoInfo(local.tipo);
              return (
                <div key={local._id}>
                  <div className={cn("flex items-center gap-3 px-4 py-3.5", !local.ativo && "opacity-50")}>
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{local.nome}</p>
                      <p className="text-xs text-muted-foreground">{info.label}</p>
                      {local.descricao && (
                        <p className="text-xs text-muted-foreground/70 truncate">{local.descricao}</p>
                      )}
                      {local.ordem > 0 && (
                        <p className="text-xs text-muted-foreground/50">Ordem: {local.ordem}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                        onClick={() => abrirEditar(local)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                        onClick={() => handleToggleAtivo(local)}
                        title={local.ativo ? "Desativar" : "Ativar"}
                      >
                        {local.ativo ? (
                          <ToggleRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  {idx < locais.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal criar/editar */}
      <Dialog open={modalAberto} onOpenChange={(v) => { if (!salvando) setModalAberto(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar local" : "Novo local de estoque"}</DialogTitle>
            <DialogDescription>
              {editando ? `Editando: ${editando.nome}` : "Preencha os dados do novo local"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="est-nome">Nome</Label>
              <Input
                id="est-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Freezer principal"
                autoFocus
                required
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="est-descricao">
                Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="est-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição do local"
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="est-ordem">
                Ordem <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="est-ordem"
                type="number"
                min={0}
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                placeholder="0"
                className="bg-background border-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                disabled={salvando || !nome.trim()}
              >
                {salvando ? "Salvando..." : editando ? "Salvar" : "Criar local"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
