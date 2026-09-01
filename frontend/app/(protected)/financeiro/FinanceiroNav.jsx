"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, List, FileText, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/financeiro/caixa", label: "Caixa", icon: Wallet },
  { href: "/financeiro/lancamentos", label: "Lançamentos", icon: List },
  { href: "/financeiro/contas-pagar", label: "Contas", icon: FileText },
  { href: "/financeiro/relatorios", label: "Relatórios", icon: BarChart2 },
];

export default function FinanceiroNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2",
                isActive
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
