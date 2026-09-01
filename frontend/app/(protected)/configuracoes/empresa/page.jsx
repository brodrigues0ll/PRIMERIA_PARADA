import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import EmpresaTab from "../tabs/EmpresaTab";

export default async function EmpresaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user?.role !== "admin") redirect("/configuracoes/perfil");
  return <EmpresaTab />;
}
