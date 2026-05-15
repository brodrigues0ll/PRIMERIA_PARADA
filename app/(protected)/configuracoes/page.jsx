import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ConfiguracoesTabs from "./ConfiguracoesTabs";

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <ConfiguracoesTabs session={session} />;
}
