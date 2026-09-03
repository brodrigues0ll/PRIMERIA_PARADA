"use client";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import { ChevronLeft, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const PAGE_META = {
  "/home": { title: null, back: null },
  "/orders": { title: "Comandas", back: "/home" },
  "/orders/fechadas": { title: "Comandas", back: "/home" },
  "/price-table": { title: "Cardápio", back: "/home" },
  "/price-table/novo": { title: "Novo item", back: "/price-table" },
  "/price-table/categorias": { title: "Categorias do Cardápio", back: "/price-table" },
  "/price-table/dia": { title: "Cardápio de Hoje", back: "/price-table" },
  "/estoque": { title: "Estoque", back: "/home" },
  "/estoque/adicionar": { title: "Novo produto", back: "/estoque" },
  "/pdv": { title: "PDV", back: "/home" },
  "/configuracoes": { title: "Configurações", back: "/home" },
  "/configuracoes/perfil": { title: "Configurações", back: "/home" },
  "/configuracoes/empresa": { title: "Configurações", back: "/home" },
  "/configuracoes/equipe": { title: "Configurações", back: "/home" },
  "/configuracoes/acesso": { title: "Configurações", back: "/home" },
  "/configuracoes/salao": { title: "Configurações", back: "/home" },
  "/salao": { title: "Salão", back: "/home" },
  "/delivery": { title: "Delivery", back: "/home" },
  "/delivery/novo": { title: "Novo pedido", back: "/delivery" },
  "/clientes": { title: "Clientes", back: "/home" },
  "/clientes/novo": { title: "Novo cliente", back: "/clientes" },
  "/whatsapp": { title: "WhatsApp", back: "/home" },
  "/estoque/locais": { title: "Locais de Estoque", back: "/estoque" },
  "/configuracoes/estoque": { title: "Configurações", back: "/home" },
  "/financeiro": { title: "Financeiro", back: "/home" },
  "/financeiro/caixa": { title: "Caixa do Dia", back: "/financeiro" },
  "/financeiro/lancamentos": { title: "Lançamentos", back: "/financeiro" },
  "/financeiro/contas-pagar": { title: "Contas a Pagar", back: "/financeiro" },
  "/financeiro/relatorios": { title: "Relatórios", back: "/financeiro" },
};

function getMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.startsWith("/orders/fechadas/")) return { title: "Comanda", back: "/orders/fechadas" };
  if (pathname.startsWith("/orders/")) return { title: "Comanda", back: "/orders" };
  if (pathname.match(/^\/price-table\/.+\/editar$/)) return { title: "Editar produto", back: "/price-table" };
  if (pathname.startsWith("/clientes/") && pathname !== "/clientes/novo") return { title: "Cliente", back: "/clientes" };
  return { title: null, back: null };
}

export default function Header({ session, empresa }) {
  const nomeEmpresa = empresa?.nome ?? "Primeira Parada";
  const logoEmpresa = empresa?.logo ?? null;
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { title, back } = getMeta(pathname);
  const isHome = pathname === "/home";
  const isOrders = pathname === "/orders" || pathname === "/orders/fechadas";

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header data-id="main-header" className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center h-14 px-4 gap-2">
        {back ? (
          <Button
            data-id="header-back-button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.push(back)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <div data-id="header-logo" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden ring-1 ring-primary/20">
              <Image
                src={logoEmpresa || "/assets/images/LOGO-2.png"}
                alt={nomeEmpresa}
                fill
                className="object-cover"
              />
            </div>
            {isHome && (
              <span className="font-brand text-base text-foreground tracking-wide">
                {nomeEmpresa}
              </span>
            )}
          </div>
        )}

        <div className="flex-1 flex justify-center">
          {title && (
            <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          )}
        </div>

        <div data-id="header-actions" className="flex items-center gap-1">
          <Button
            data-id="header-theme-toggle"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
          >
            {mounted && resolvedTheme === "dark"
              ? <Sun className="h-4 w-4" />
              : <Moon className="h-4 w-4" />}
          </Button>

          {session && (
            <Button
              data-id="logout-button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {isOrders && (
        <>
          <Separator />
          <div data-id="orders-tab-bar" className="flex">
            {[
              { label: "Abertas", href: "/orders" },
              { label: "Fechadas", href: "/orders/fechadas" },
            ].map((tab) => {
              const active = pathname === tab.href;
              return (
                <button
                  key={tab.href}
                  data-id={`orders-tab-${tab.href.split("/").pop()}`}
                  onClick={() => router.push(tab.href)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-medium transition-colors border-b-2",
                    active
                      ? "text-foreground border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </header>
  );
}
