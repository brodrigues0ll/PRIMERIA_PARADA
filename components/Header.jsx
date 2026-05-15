"use client";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const PAGE_META = {
  "/home": { title: null, back: null },
  "/orders": { title: "Comandas", back: "/home" },
  "/orders/fechadas": { title: "Comandas", back: "/home" },
  "/price-table": { title: "Cardápio", back: "/home" },
  "/price-table/novo": { title: "Novo item", back: "/price-table" },
  "/estoque": { title: "Estoque", back: "/home" },
  "/estoque/adicionar": { title: "Novo produto", back: "/estoque" },
  "/pdv": { title: "PDV", back: "/home" },
  "/configuracoes": { title: "Configurações", back: "/home" },
};

function getMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.startsWith("/orders/fechadas/")) return { title: "Comanda", back: "/orders/fechadas" };
  if (pathname.startsWith("/orders/")) return { title: "Comanda", back: "/orders" };
  if (pathname.match(/^\/price-table\/.+\/editar$/)) return { title: "Editar produto", back: "/price-table" };
  return { title: null, back: null };
}

export default function Header({ session, empresa }) {
  const nomeEmpresa = empresa?.nome ?? "Primeira Parada";
  const logoEmpresa = empresa?.logo ?? null;
  const pathname = usePathname();
  const router = useRouter();
  const { title, back } = getMeta(pathname);
  const isHome = pathname === "/home";
  const isOrders = pathname === "/orders" || pathname === "/orders/fechadas";

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center h-14 px-4 gap-2">
        {back ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => router.push(back)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2.5">
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

        {session && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isOrders && (
        <>
          <Separator />
          <div className="flex">
            {[
              { label: "Abertas", href: "/orders" },
              { label: "Fechadas", href: "/orders/fechadas" },
            ].map((tab) => {
              const active = pathname === tab.href;
              return (
                <button
                  key={tab.href}
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
