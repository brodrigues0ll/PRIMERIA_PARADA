import { ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function MenuItemCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-accent/50 active:bg-accent transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-snug">
          {item.nome}
        </p>
        {item.codigo && (
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.codigo}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          R$&nbsp;{formatPrice(item.preco)}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
      </div>
    </button>
  );
}
