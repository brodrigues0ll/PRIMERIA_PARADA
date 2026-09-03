"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function SectionTitle({ children }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{children}</p>
  );
}

function EnderecoItem({ endereco, idx, onChange, onRemove }) {
  function field(name) {
    return {
      value: endereco[name] || "",
      onChange: (e) => onChange(idx, { ...endereco, [name]: e.target.value }),
    };
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Input
          placeholder="Rótulo (ex: Casa, Trabalho)"
          className="h-8 border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0 flex-1"
          {...field("label")}
        />
        <button type="button" onClick={() => onRemove(idx)} className="ml-2 shrink-0">
          <X className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Rua</Label>
            <Input placeholder="Rua, Av..." {...field("rua")} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Número</Label>
            <Input placeholder="123" {...field("numero")} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Bairro</Label>
          <Input placeholder="Bairro" {...field("bairro")} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Complemento</Label>
            <Input placeholder="Apto, Bloco..." {...field("complemento")} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Referência</Label>
            <Input placeholder="Próximo a..." {...field("referencia")} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NovoClientePage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [perfil, setPerfil] = useState("avista");
  const [observacoes, setObservacoes] = useState("");
  const [enderecos, setEnderecos] = useState([]);
  const [mostrarEnderecos, setMostrarEnderecos] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function adicionarEndereco() {
    setEnderecos((prev) => [
      ...prev,
      { label: "Casa", rua: "", numero: "", bairro: "", complemento: "", referencia: "" },
    ]);
    setMostrarEnderecos(true);
  }

  function alterarEndereco(idx, novo) {
    setEnderecos((prev) => prev.map((e, i) => (i === idx ? novo : e)));
  }

  function removerEndereco(idx) {
    setEnderecos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), telefone, perfil_pagamento: perfil, observacoes, enderecos }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao criar cliente");
      }

      toast.success("Cliente cadastrado com sucesso");
      router.push("/clientes");
    } catch (err) {
      toast.error(err.message || "Erro ao criar cliente");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form data-id="cliente-form" onSubmit={handleSubmit} className="px-4 pt-6 pb-28 space-y-8">

      {/* Dados principais */}
      <div>
        <SectionTitle>Dados do cliente</SectionTitle>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              data-id="cliente-name-input"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Telefone</Label>
            <Input
              data-id="cliente-phone-input"
              placeholder="(00) 00000-0000"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Perfil de pagamento</Label>
            <Select data-id="cliente-payment-profile-select" value={perfil} onValueChange={setPerfil}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avista">À vista</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Observações</Label>
            <textarea
              data-id="cliente-observations-input"
              placeholder="Observações sobre o cliente..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Endereços */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Endereços</SectionTitle>
          {enderecos.length > 0 && (
            <button
              type="button"
              onClick={() => setMostrarEnderecos((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              {mostrarEnderecos ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {enderecos.length} endereço{enderecos.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>

        {mostrarEnderecos && enderecos.length > 0 && (
          <div className="space-y-3 mb-3">
            {enderecos.map((end, idx) => (
              <EnderecoItem
                key={idx}
                endereco={end}
                idx={idx}
                onChange={alterarEndereco}
                onRemove={removerEndereco}
              />
            ))}
          </div>
        )}

        <Button
          data-id="add-endereco-button"
          type="button"
          variant="outline"
          className="w-full"
          onClick={adicionarEndereco}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar endereço
        </Button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-md border-t border-border px-4 py-4">
        <Button data-id="save-cliente-button" type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
          {submitting ? "Salvando..." : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
