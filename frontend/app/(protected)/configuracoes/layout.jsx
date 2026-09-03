import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ConfiguracoesNav from "./ConfiguracoesNav";

export default async function ConfiguracoesLayout({ children }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="pb-10" data-id="configuracoes-layout">
      <ConfiguracoesNav isAdmin={isAdmin} />
      <div className="px-4 pt-6" data-id="configuracoes-content">
        {children}
      </div>
    </div>
  );
}
