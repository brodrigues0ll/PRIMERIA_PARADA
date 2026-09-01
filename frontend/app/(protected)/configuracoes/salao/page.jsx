import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SalaoTab from "../tabs/SalaoTab";

export default async function SalaoConfigPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user?.role !== "admin") redirect("/configuracoes/perfil");
  return <SalaoTab />;
}
