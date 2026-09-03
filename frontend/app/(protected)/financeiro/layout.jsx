import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import FinanceiroNav from "./FinanceiroNav";

export default async function FinanceiroLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div data-id="financeiro-layout" className="pb-10">
      <FinanceiroNav />
      <div className="px-4 pt-6">
        {children}
      </div>
    </div>
  );
}
