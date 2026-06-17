"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/useApi";
import { formatCents } from "@/lib/format";
import type { TransactionResponse } from "@/lib/types";

export default function AtividadePage() {
  const callApi = useApi();
  const [txs, setTxs] = useState<TransactionResponse[] | null>(null);

  useEffect(() => {
    callApi<TransactionResponse[]>("/perfil/atividade").then(setTxs).catch(() => setTxs([]));
  }, [callApi]);

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link href="/perfil">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Atividade</h1>
      </div>

      {txs === null && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {txs && txs.length === 0 && (
        <p className="text-sm text-muted-foreground">Ainda sem movimentações.</p>
      )}

      <ul className="space-y-2">
        {txs?.map((tx) => (
          <li
            key={tx.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {tx.type === "recharge" ? (
                <ArrowDownCircle className="h-6 w-6 text-emerald-600 shrink-0" />
              ) : (
                <ArrowUpCircle className="h-6 w-6 text-destructive shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {tx.type === "recharge" ? "Recarga" : "Pagamento"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.created_at).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
            <span
              className={`tabular-nums font-medium ${
                tx.type === "recharge" ? "text-emerald-600" : "text-destructive"
              }`}
            >
              {tx.type === "recharge" ? "+" : "−"}
              {formatCents(tx.amount_cents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
