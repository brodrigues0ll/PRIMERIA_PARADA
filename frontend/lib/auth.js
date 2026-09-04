import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * Retorna a sessão autenticada ou uma NextResponse 401.
 * Uso: const { session, error } = await getAuthSession();
 *      if (error) return error;
 */
export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/**
 * Verifica se a sessão possui a permissão solicitada.
 * Admin sempre tem acesso. Retorna true/false.
 */
export function hasPermission(session, permission) {
  if (!session?.user) return false;
  if (session.user.role === "admin") return true;
  return session.user.permissoes?.includes(permission) ?? false;
}

/**
 * Guard para rotas de API. Retorna { session, error }.
 * Se não tiver a permissão, error é uma NextResponse 403.
 */
export async function requirePermission(permission) {
  const { session, error } = await getAuthSession();
  if (error) return { session: null, error };

  if (!hasPermission(session, permission)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Sem permissão para esta operação" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
