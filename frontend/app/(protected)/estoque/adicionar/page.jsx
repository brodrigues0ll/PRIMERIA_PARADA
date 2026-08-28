"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import BarcodeScanner from "@/components/BarcodeScanner";
import { ShoppingCart, Package, Loader2, ImageOff, CheckCircle2, Upload, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

function parseDecimal(str) {
  return parseFloat(String(str).replace(",", ".")) || 0;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function NovoProdutoEstoquePage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [imagem, setImagem] = useState(null);
  const [precoCompra, setPrecoCompra] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [qtdInicial, setQtdInicial] = useState("");
  const [minimo, setMinimo] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const lookupRef = useRef(null);
  const fileInputRef = useRef(null);

  const precoCompraNum = parseDecimal(precoCompra);
  const precoVendaNum = parseDecimal(precoVenda);
  const showMargem = precoCompraNum > 0 && precoVendaNum > 0;
  const margem = showMargem ? ((precoVendaNum - precoCompraNum) / precoVendaNum) * 100 : 0;
  const lucro = precoVendaNum - precoCompraNum;
  const isVendavel = precoVendaNum > 0;
  const margemColor = margem < 20 ? "text-destructive" : margem <= 40 ? "text-amber-500" : "text-emerald-500";

  async function buscarProduto(code) {
    const trimmed = code.trim();
    if (!trimmed || !/^\d{8,14}$/.test(trimmed)) return;

    if (lookupRef.current) clearTimeout(lookupRef.current);

    setLookupLoading(true);
    setLookupDone(false);
    try {
      const res = await fetch(`/api/barcode-lookup/${trimmed}`);
      const data = await res.json();

      if (res.ok) {
        if (data.nome) setNome(data.nome);
        if (data.imagem) setImagem(data.imagem);
        setLookupDone(true);
        toast.success("Produto encontrado na base de dados");
      } else {
        toast.info("Produto não encontrado na base — preencha manualmente");
      }
    } catch {
      // falhou silenciosamente
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json();
        toast.error(d.message || "Erro ao enviar imagem");
        return;
      }

      const { data } = await res.json();
      setImagem(data.url);
      toast.success("Imagem enviada com sucesso");
    } catch {
      toast.error("Erro ao conectar com o servidor de upload");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleScan(code) {
    setCodigo(code);
    toast.info("Código lido");
    buscarProduto(code);
  }

  function handleCodigoBlur() {
    buscarProduto(codigo);
  }

  function handleCodigoKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarProduto(codigo);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          codigo: codigo.trim(),
          imagem: imagem ?? null,
          precoCompra: precoCompraNum,
          precoVenda: precoVendaNum,
          quantidade: parseInt(qtdInicial, 10) || 0,
          minimo: parseInt(minimo, 10) || 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Erro ao criar produto");
        return;
      }
      const { data: produto } = await res.json();

      const qtd = parseInt(qtdInicial, 10);
      if (qtd > 0) {
        await fetch(`/api/produtos/${produto._id}/movimento`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "ajuste", quantidade: qtd, observacao: "Estoque inicial" }),
        });
      }

      toast.success("Produto criado!");
      router.push("/estoque");
    } catch {
      toast.error("Erro ao criar produto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h2 className="text-lg font-semibold mb-1">Novo produto</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Adicione um produto ao controle de estoque
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <BarcodeScanner onScan={handleScan} placeholder="Escanear código de barras" />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="codigo">Código de barras</Label>
          <div className="relative">
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setLookupDone(false); }}
              onBlur={handleCodigoBlur}
              onKeyDown={handleCodigoKeyDown}
              placeholder="Escanear ou digitar"
              className={cn(lookupDone && "pr-9")}
            />
            {lookupLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {lookupDone && !lookupLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Nome e imagem serão buscados automaticamente pelo código
          </p>
        </div>

        {/* Imagem */}
        <div className="flex flex-col gap-2">
          <Label>Imagem do produto</Label>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-center bg-muted/40 min-h-40 relative">
              {lookupLoading || uploadLoading ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {uploadLoading ? "Enviando imagem..." : "Buscando produto..."}
                  </p>
                </div>
              ) : imagem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagem}
                  alt={nome}
                  className="max-h-48 w-auto object-contain py-4 px-6"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-10">
                  <ImageOff className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Sem imagem</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {imagem ? "Trocar foto" : "Enviar foto"}
              </button>

              {imagem && !uploadLoading && (
                <button
                  type="button"
                  onClick={() => setImagem(null)}
                  className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Fardo de arroz 5 kg, Cerveja Skol lata"
            required
          />
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Preços</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="precoCompra">Custo (R$)</Label>
              <Input id="precoCompra" value={precoCompra} onChange={(e) => setPrecoCompra(e.target.value)} inputMode="decimal" placeholder="0,00" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <Label htmlFor="precoVenda">Venda (R$)</Label>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">opcional</span>
              </div>
              <Input id="precoVenda" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} inputMode="decimal" placeholder="0,00" />
            </div>
          </div>
        </div>

        <div className={cn(
          "rounded-xl border px-4 py-3 flex items-start gap-3",
          isVendavel ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/50 border-border"
        )}>
          {isVendavel
            ? <ShoppingCart className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            : <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
          <div>
            <p className={cn("text-xs font-semibold", isVendavel ? "text-emerald-600" : "text-muted-foreground")}>
              {isVendavel ? "Produto vendável" : "Uso interno"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isVendavel
                ? "Pode ser vendido pelo PDV (barcode) e vinculado ao cardápio"
                : "Não aparece no PDV por barcode — apenas controle de estoque"}
            </p>
          </div>
        </div>

        {showMargem && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-1">
            <p className={`text-sm font-semibold ${margemColor}`}>Margem: {margem.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">
              Lucro: R$&nbsp;{lucro.toFixed(2).replace(".", ",")} por unidade
            </p>
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <Label htmlFor="qtdInicial">Qtd. inicial</Label>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">opcional</span>
            </div>
            <Input id="qtdInicial" type="number" min="0" step="1" value={qtdInicial} onChange={(e) => setQtdInicial(e.target.value)} placeholder="0" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <Label htmlFor="minimo">Qtd. mínima</Label>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">opcional</span>
            </div>
            <Input id="minimo" type="number" min="0" step="1" value={minimo} onChange={(e) => setMinimo(e.target.value)} placeholder="0" />
          </div>
        </div>

        <Button type="submit" className="w-full bg-primary" disabled={loading || !nome.trim()}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {loading ? "Criando..." : "Criar produto"}
        </Button>

        <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
          Cancelar
        </Button>
      </form>
    </div>
  );
}
