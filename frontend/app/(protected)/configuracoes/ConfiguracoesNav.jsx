"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Building2, Users, Shield, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS_ADMIN = [
  { href: "/configuracoes/empresa", label: "Empresa", icon: Building2 },
  { href: "/configuracoes/equipe", label: "Equipe", icon: Users },
  { href: "/configuracoes/acesso", label: "Acesso", icon: Shield },
  { href: "/configuracoes/salao", label: "Salão", icon: LayoutGrid },
];

export default function ConfiguracoesNav({ isAdmin }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/configuracoes/perfil", label: "Perfil", icon: User },
    ...(isAdmin ? TABS_ADMIN : []),
  ];

  return (
    <div className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="flex overflow-x-auto scrollbar-none">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1 py-3 px-4 text-xs font-medium transition-colors border-b-2 min-w-[64px]",
                active
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
