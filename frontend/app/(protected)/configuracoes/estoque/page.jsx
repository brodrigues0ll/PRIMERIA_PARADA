import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import EstoqueConfigTab from "../tabs/EstoqueConfigTab";

export default async function EstoqueConfigPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user?.role !== "admin") redirect("/configuracoes/perfil");
  return <EstoqueConfigTab />;
}
