import { ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function MenuItemCard({ item, onClick, categoria, ativo = true }) {
  const cat = categoria ?? item.categoria ?? null;

  return (
    <button
      data-id={`menu-item-card-${item._id}`}
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-accent/50 active:bg-accent transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 leading-snug">
          <p data-id="menu-item-name" className="text-sm font-medium text-foreground truncate">
            {item.nome}
          </p>
          {ativo === false && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-semibold">
              Inativo
            </span>
          )}
        </div>

        {cat?.nome && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {cat.cor && (
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10"
                style={{ backgroundColor: cat.cor }}
              />
            )}
            <p data-id="menu-item-categoria" className="text-xs text-muted-foreground truncate">
              {cat.nome}
            </p>
          </div>
        )}

        {!cat?.nome && item.codigo && (
          <p data-id="menu-item-code" className="text-xs text-muted-foreground font-mono mt-0.5">{item.codigo}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span data-id="menu-item-price" className="text-sm font-semibold tabular-nums text-foreground">
          R$&nbsp;{formatPrice(item.preco)}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
      </div>
    </button>
  );
}
