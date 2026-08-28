"use client";
import { useState } from "react";
import { User, Building2, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import PerfilTab from "./tabs/PerfilTab";
import EmpresaTab from "./tabs/EmpresaTab";
import FuncionariosTab from "./tabs/FuncionariosTab";
import PermissoesTab from "./tabs/PermissoesTab";

export default function ConfiguracoesTabs({ session }) {
  const isAdmin = session?.user?.role === "admin";

  const tabs = [
    { id: "perfil", label: "Perfil", icon: User },
    ...(isAdmin ? [
      { id: "empresa", label: "Empresa", icon: Building2 },
      { id: "equipe", label: "Equipe", icon: Users },
      { id: "acesso", label: "Acesso", icon: Shield },
    ] : []),
  ];

  const [active, setActive] = useState("perfil");

  return (
    <div className="pb-10">
      {/* Tab bar */}
      <div className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2",
                active === id
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pt-6">
        {active === "perfil" && <PerfilTab session={session} />}
        {active === "empresa" && isAdmin && <EmpresaTab />}
        {active === "equipe" && isAdmin && <FuncionariosTab currentUserId={session.user.id} />}
        {active === "acesso" && isAdmin && <PermissoesTab />}
      </div>
    </div>
  );
}
