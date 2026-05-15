import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import { Empresa } from "@/lib/models";
import Header from "@/components/Header";

async function getEmpresa() {
  try {
    await connectDB();
    const e = await Empresa.findOne({}).lean();
    return e ? { nome: e.nome, logo: e.logo } : { nome: "Primeira Parada", logo: null };
  } catch {
    return { nome: "Primeira Parada", logo: null };
  }
}

export default async function ProtectedLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const empresa = await getEmpresa();

  return (
    <div className="min-h-screen bg-background">
      <Header session={session} empresa={empresa} />
      <main>{children}</main>
    </div>
  );
}
