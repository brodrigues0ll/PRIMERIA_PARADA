"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import OrderCard from "@/components/OrderCard";
import AddOrderModal from "@/components/AddOrderModal";

export default function OrdersPage() {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchComandas = useCallback(async () => {
    try {
      const res = await fetch("/api/comandas?status=aberta");
      const data = await res.json();
      if (res.ok) setComandas(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComandas(); }, [fetchComandas]);

  return (
    <>
      <div className="pb-28">

        {/* Skeletons */}
        {loading && (
          <div className="mx-4 mt-4 rounded-2xl border border-border overflow-hidden bg-card">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                {i < 3 && <Separator />}
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && comandas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Nenhuma comanda aberta</p>
            <p className="text-xs text-muted-foreground">Toque no + para criar uma nova</p>
          </div>
        )}

        {/* Lista */}
        {!loading && comandas.length > 0 && (
          <div className="px-4 pt-4 flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground px-1 mb-1">
              {comandas.length} aberta{comandas.length !== 1 ? "s" : ""}
            </p>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {comandas.map((c, i) => (
                <div key={c._id}>
                  <OrderCard comanda={c} href={`/orders/${c._id}`} />
                  {i < comandas.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-5 z-30">
        <Button
          size="icon"
          className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <AddOrderModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); fetchComandas(); }}
      />
    </>
  );
}
