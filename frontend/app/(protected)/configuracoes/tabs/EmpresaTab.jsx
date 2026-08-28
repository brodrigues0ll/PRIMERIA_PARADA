"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Camera, Loader2, Building2 } from "lucide-react";

export default function EmpresaTab() {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    fetch("/api/empresa")
      .then((r) => r.json())
      .then((d) => { setEmpresa(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("Logo muito grande. Máximo 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEmpresa((p) => ({ ...p, logo: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/empresa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setEmpresa(data);
      toast.success("Empresa atualizada");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center py-4">
          <Skeleton className="h-20 w-20 rounded-xl" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-20 w-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden">
            {empresa?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={empresa.logo} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center ring-2 ring-background"
          >
            <Camera className="h-3.5 w-3.5 text-primary-foreground" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>
        <p className="text-xs text-muted-foreground">Logo da empresa (máx. 1 MB)</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Informações</p>
        {[
          { key: "nome", label: "Nome da empresa", placeholder: "Ex: Primeira Parada" },
          { key: "slogan", label: "Slogan", placeholder: "Ex: O melhor bar da cidade" },
          { key: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00" },
          { key: "telefone", label: "Telefone", placeholder: "(00) 00000-0000" },
          { key: "endereco", label: "Endereço", placeholder: "Rua, número, bairro, cidade" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{label}</label>
            <Input
              value={empresa?.[key] ?? ""}
              onChange={(e) => setEmpresa((p) => ({ ...p, [key]: e.target.value }))}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Salvar empresa
      </Button>
    </div>
  );
}
