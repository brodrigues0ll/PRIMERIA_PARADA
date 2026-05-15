"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

export default function PerfilTab({ session }) {
  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [foto, setFoto] = useState(session?.user?.foto ?? null);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const initials = (name || email || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("Foto muito grande. Máximo 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (novaSenha && novaSenha !== confirmSenha) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      const body = { name, email, foto };
      if (novaSenha) {
        body.senhaAtual = senhaAtual;
        body.novaSenha = novaSenha;
      }
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmSenha("");
      toast.success("Perfil atualizado");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-border">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="Foto" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">{initials}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center ring-2 ring-background"
          >
            <Camera className="h-3.5 w-3.5 text-primary-foreground" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
        </div>
        <p className="text-xs text-muted-foreground">Máximo 500 KB</p>
      </div>

      <Separator />

      {/* Dados */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dados pessoais</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nome</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
        </div>
      </div>

      <Separator />

      {/* Senha */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Alterar senha</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Senha atual</label>
          <Input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="••••••" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nova senha</label>
          <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="••••••" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Confirmar nova senha</label>
          <Input type="password" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} placeholder="••••••" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Salvar alterações
      </Button>
    </div>
  );
}
