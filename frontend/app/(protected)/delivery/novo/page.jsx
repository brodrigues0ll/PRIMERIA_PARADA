"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const FORMAS_PAGAMENTO = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
];

function SectionTitle({ children }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{children}</p>
  );
}

function EnderecoFields({ values, onChange, prefix = "" }) {
  function field(name) {
    return {
      value: values[name] || "",
      onChange: (e) => onChange({ ...values, [name]: e.target.value }),
    };
  }
  return (
    <div className="space-y-3">
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
  );
}

export default function NovoDeliveryPage() {
  const router = useRouter();

  const [tipoCliente, setTipoCliente] = useState("cadastrado");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [enderecoSelecionadoIdx, setEnderecoSelecionadoIdx] = useState(null);
  const [nomeAvulso, setNomeAvulso] = useState("");

  const [endereco, setEndereco] = useState({ rua: "", numero: "", bairro: "", complemento: "", referencia: "" });

  const [cardapio, setCardapio] = useState([]);
  const [buscaItem, setBuscaItem] = useState("");
  const [itens, setItens] = useState([]);

  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [trocoPara, setTrocoPara] = useState("");
  const [naConta, setNaConta] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const buscaClienteTimer = useRef(null);

  useEffect(() => {
    fetch("/api/cardapio")
      .then((r) => r.json())
      .then((json) => setCardapio(json.data || []));
  }, []);

  useEffect(() => {
    clearTimeout(buscaClienteTimer.current);
    if (!buscaCliente.trim() || tipoCliente !== "cadastrado") {
      setResultadosCliente([]);
      return;
    }
    buscaClienteTimer.current = setTimeout(async () => {
      setBuscandoCliente(true);
      try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(buscaCliente)}&ativo=true`);
        const json = await res.json();
        setResultadosCliente(json.data || []);
      } finally {
        setBuscandoCliente(false);
      }
    }, 350);
  }, [buscaCliente, tipoCliente]);

  function selecionarCliente(cliente) {
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome);
    setResultadosCliente([]);
    setEnderecoSelecionadoIdx(null);
    setEndereco({ rua: "", numero: "", bairro: "", complemento: "", referencia: "" });
  }

  function selecionarEnderecoCliente(idx) {
    setEnderecoSelecionadoIdx(idx);
    const end = clienteSelecionado.enderecos[idx];
    setEndereco({
      rua: end.rua || "",
      numero: end.numero || "",
      bairro: end.bairro || "",
      complemento: end.complemento || "",
      referencia: end.referencia || "",
    });
  }

  const itemsFiltrados = cardapio.filter((item) =>
    item.nome.toLowerCase().includes(buscaItem.toLowerCase())
  );

  function adicionarItem(menuItem) {
    setItens((prev) => {
      const idx = prev.findIndex((it) => it.menuItem === menuItem._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantidade: next[idx].quantidade + 1 };
        return next;
      }
      return [...prev, { menuItem: menuItem._id, nome: menuItem.nome, preco: menuItem.preco, quantidade: 1, observacao: "" }];
    });
  }

  function removerItem(idx) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  function alterarQtd(idx, delta) {
    setItens((prev) => {
      const next = [...prev];
      const nova = next[idx].quantidade + delta;
      if (nova <= 0) return prev.filter((_, i) => i !== idx);
      next[idx] = { ...next[idx], quantidade: nova };
      return next;
    });
  }

  function alterarObs(idx, obs) {
    setItens((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], observacao: obs };
      return next;
    });
  }

  const total = itens.reduce((acc, it) => acc + it.preco * it.quantidade, 0);
  const trocoVal = formaPagamento === "dinheiro" && trocoPara && Number(trocoPara) > total
    ? Number(trocoPara) - total
    : null;

  const podeNaConta = clienteSelecionado && clienteSelecionado.perfil_pagamento !== "avista";

  async function handleSubmit(e) {
    e.preventDefault();
    if (tipoCliente === "avulso" && !nomeAvulso.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }
    if (!endereco.rua || !endereco.bairro) {
      toast.error("Informe rua e bairro para entrega");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        cliente_id: tipoCliente === "cadastrado" ? clienteSelecionado?._id : null,
        nome_avulso: tipoCliente === "avulso" ? nomeAvulso : null,
        endereco_entrega: endereco,
        itens: itens.map((it) => ({ menuItem: it.menuItem, quantidade: it.quantidade, observacao: it.observacao })),
        forma_pagamento: formaPagamento,
        troco_para: formaPagamento === "dinheiro" && trocoPara ? Number(trocoPara) : null,
        na_conta: podeNaConta ? naConta : false,
      };

      const res = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao criar pedido");
      }

      toast.success("Pedido criado com sucesso");
      router.push("/delivery");
    } catch (err) {
      toast.error(err.message || "Erro ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pt-6 pb-28 space-y-8">

      {/* Seção: Cliente */}
      <div>
        <SectionTitle>Cliente</SectionTitle>

        <div className="flex rounded-xl border border-border overflow-hidden mb-4">
          {["cadastrado", "avulso"].map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => {
                setTipoCliente(tipo);
                setClienteSelecionado(null);
                setBuscaCliente("");
                setResultadosCliente([]);
              }}
              className={cn(
                "flex-1 py-2 text-sm font-medium transition-colors",
                tipoCliente === tipo
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tipo === "cadastrado" ? "Cliente cadastrado" : "Avulso"}
            </button>
          ))}
        </div>

        {tipoCliente === "cadastrado" ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                className="pl-9"
                value={buscaCliente}
                onChange={(e) => {
                  setBuscaCliente(e.target.value);
                  if (clienteSelecionado) setClienteSelecionado(null);
                }}
              />
            </div>

            {resultadosCliente.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {resultadosCliente.map((c, i) => (
                  <div key={c._id}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                      onClick={() => selecionarCliente(c)}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
                        {c.nome[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.nome}</p>
                        {c.telefone && <p className="text-xs text-muted-foreground">{c.telefone}</p>}
                      </div>
                    </button>
                    {i < resultadosCliente.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}

            {clienteSelecionado && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{clienteSelecionado.nome}</p>
                    {clienteSelecionado.telefone && (
                      <p className="text-xs text-muted-foreground">{clienteSelecionado.telefone}</p>
                    )}
                  </div>
                  <button type="button" onClick={() => { setClienteSelecionado(null); setBuscaCliente(""); }}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {clienteSelecionado.enderecos?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Endereços salvos</p>
                    <div className="space-y-1.5">
                      {clienteSelecionado.enderecos.map((end, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selecionarEnderecoCliente(idx)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors",
                            enderecoSelecionadoIdx === idx
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-border/60"
                          )}
                        >
                          <span className="font-medium">{end.label || "Endereço"}</span>
                          {" · "}
                          {[end.rua, end.numero, end.bairro].filter(Boolean).join(", ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome do cliente</Label>
            <Input
              placeholder="Nome"
              value={nomeAvulso}
              onChange={(e) => setNomeAvulso(e.target.value)}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Seção: Endereço */}
      <div>
        <SectionTitle>Endereço de entrega</SectionTitle>
        <EnderecoFields values={endereco} onChange={setEndereco} />
      </div>

      <Separator />

      {/* Seção: Itens */}
      <div>
        <SectionTitle>Itens do pedido</SectionTitle>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar no cardápio..."
            className="pl-9"
            value={buscaItem}
            onChange={(e) => setBuscaItem(e.target.value)}
          />
        </div>

        {buscaItem && itemsFiltrados.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
            {itemsFiltrados.slice(0, 8).map((item, i) => (
              <div key={item._id}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                  onClick={() => { adicionarItem(item); setBuscaItem(""); }}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground text-left">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">R$ {formatPrice(item.preco)}</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                </button>
                {i < Math.min(itemsFiltrados.length, 8) - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}

        {itens.length > 0 ? (
          <div className="space-y-2">
            {itens.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">R$ {formatPrice(item.preco)} · total R$ {formatPrice(item.preco * item.quantidade)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => alterarQtd(idx, -1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-accent">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantidade}</span>
                    <button type="button" onClick={() => alterarQtd(idx, 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-accent">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => removerItem(idx)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10">
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <Input
                    placeholder="Observação (ex: sem feijão)"
                    className="h-8 text-xs"
                    value={item.observacao}
                    onChange={(e) => alterarObs(idx, e.target.value)}
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between px-1 pt-1">
              <p className="text-xs text-muted-foreground">{itens.reduce((a, it) => a + it.quantidade, 0)} itens</p>
              <p className="text-sm font-bold text-foreground">Total: R$ {formatPrice(total)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Busque e adicione itens do cardápio</p>
        )}
      </div>

      <Separator />

      {/* Seção: Pagamento */}
      <div>
        <SectionTitle>Pagamento</SectionTitle>

        <div className="flex rounded-xl border border-border overflow-hidden mb-4">
          {FORMAS_PAGAMENTO.map((fp) => (
            <button
              key={fp.value}
              type="button"
              onClick={() => setFormaPagamento(fp.value)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-colors",
                formaPagamento === fp.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {fp.label}
            </button>
          ))}
        </div>

        {formaPagamento === "dinheiro" && (
          <div className="space-y-2 mb-4">
            <Label className="text-xs text-muted-foreground block">Troco para R$</Label>
            <Input
              type="number"
              placeholder="0,00"
              step="0.01"
              min={total}
              value={trocoPara}
              onChange={(e) => setTrocoPara(e.target.value)}
            />
            {trocoVal !== null && (
              <p className="text-xs text-muted-foreground">
                Troco: <span className="font-semibold text-foreground">R$ {formatPrice(trocoVal)}</span>
              </p>
            )}
          </div>
        )}

        {podeNaConta && (
          <button
            type="button"
            onClick={() => setNaConta((v) => !v)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors",
              naConta ? "border-primary bg-primary/10" : "border-border hover:bg-accent/50"
            )}
          >
            <span className="text-sm text-foreground">Lançar na conta</span>
            <div className={cn(
              "h-5 w-9 rounded-full transition-colors relative",
              naConta ? "bg-primary" : "bg-muted"
            )}>
              <div className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                naConta ? "translate-x-4" : "translate-x-0.5"
              )} />
            </div>
          </button>
        )}
      </div>

      {/* Botão enviar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-md border-t border-border px-4 py-4">
        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
          {submitting ? "Criando pedido..." : `Criar pedido${total > 0 ? ` · R$ ${formatPrice(total)}` : ""}`}
        </Button>
      </div>
    </form>
  );
}
