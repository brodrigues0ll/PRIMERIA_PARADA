import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import FuncionariosTab from "../tabs/FuncionariosTab";

export default async function EquipePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user?.role !== "admin") redirect("/configuracoes/perfil");
  return <FuncionariosTab currentUserId={session.user.id} />;
}
