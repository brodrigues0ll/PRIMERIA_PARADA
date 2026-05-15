"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Email ou senha incorretos");
      } else {
        router.push("/home");
        router.refresh();
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      {/* Logo + marca */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative h-20 w-20 rounded-3xl overflow-hidden ring-1 ring-white/10 mb-5 shadow-xl shadow-black/40">
          <Image
            src="/assets/images/LOGO-2.png"
            alt="Primeira Parada"
            fill
            className="object-cover"
          />
        </div>
        <h1 className="font-brand text-3xl text-foreground tracking-wide">
          Primeira Parada
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Sistema de gestão
        </p>
      </div>

      {/* Formulário */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl shadow-black/50">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="email"
              className="text-xs text-muted-foreground font-medium"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              className="h-12 bg-card border-border rounded-xl px-4 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="seu@email.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className="text-xs text-muted-foreground font-medium"
            >
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                className="h-12 bg-card border-border rounded-xl px-4 pr-11 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Erro */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              error ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          </div>

          {/* Botão */}
          <Button
            type="submit"
            className={cn(
              "h-12 w-full rounded-xl mt-1 text-sm font-semibold",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-all duration-150 active:scale-[0.98]",
              loading && "opacity-70"
            )}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </div>

      <p className="text-xs text-muted-foreground/50 mt-8">
        © {new Date().getFullYear()} Primeira Parada
      </p>
    </div>
  );
}
