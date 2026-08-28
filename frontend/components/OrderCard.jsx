import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function OrderCard({ comanda, href }) {
  const isClosed = comanda.status === "fechada";
  const initial = comanda.nome?.[0]?.toUpperCase() ?? "?";
  const time = formatRelativeTime(isClosed ? comanda.fechadaEm : comanda.abertaEm);

  return (
    <Link href={href} className="block group">
      <div className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-accent/40 active:bg-accent transition-colors">

        {/* Avatar */}
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
          isClosed
            ? "bg-muted text-muted-foreground"
            : "bg-primary/15 text-primary"
        )}>
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-snug">
            {comanda.nome}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              isClosed ? "bg-muted-foreground/40" : "bg-emerald-500"
            )} />
            <span className="text-xs text-muted-foreground truncate">{time}</span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </div>
    </Link>
  );
}
