"use client";
import { useSession } from "next-auth/react";

/**
 * Retorna true se o usuário tem a permissão solicitada.
 * Admin sempre retorna true para qualquer permissão.
 */
export function usePermissao(permissao) {
  const { data: session } = useSession();
  if (!session) return false;
  if (session.user?.role === "admin") return true;
  return (session.user?.permissoes ?? []).includes(permissao);
}

/**
 * Retorna true se o usuário tem TODAS as permissões informadas.
 */
export function usePermissoes(...permissoes) {
  const { data: session } = useSession();
  if (!session) return false;
  if (session.user?.role === "admin") return true;
  const userPerms = session.user?.permissoes ?? [];
  return permissoes.every((p) => userPerms.includes(p));
}
