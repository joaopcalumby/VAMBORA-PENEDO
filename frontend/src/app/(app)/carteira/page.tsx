"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, QrCode, Plus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { formatCents } from "@/lib/format";
import type { WalletResponse } from "@/lib/types";

export default function CarteiraPage() {
  const callApi = useApi();
  const [wallet, setWallet] = useState<WalletResponse | null>(null);

  useEffect(() => {
    callApi<WalletResponse>("/carteira")
      .then(setWallet)
      .catch(() => setWallet({ balance_cents: 0, last_transactions: [] }));
  }, [callApi]);

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Saldo</p>
        {wallet ? (
          <p className="text-4xl font-semibold tabular-nums">{formatCents(wallet.balance_cents)}</p>
        ) : (
          <Skeleton className="h-10 w-40 mx-auto" />
        )}
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="flex-col h-auto gap-2 py-4">
          <Link href="/carteira/pagar">
            <QrCode className="h-5 w-5" />
            <span className="text-sm">Pagar passagem</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-col h-auto gap-2 py-4">
          <Link href="/carteira/recarregar">
            <Plus className="h-5 w-5" />
            <span className="text-sm">Adicionar créditos</span>
          </Link>
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Últimas transações</h2>
          {wallet && wallet.last_transactions.length > 0 && (
            <Button asChild variant="link" size="sm">
              <Link href="/perfil/atividade">Ver todas</Link>
            </Button>
          )}
        </div>

        {!wallet && (
          <ul className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-14 w-full" />
              </li>
            ))}
          </ul>
        )}

        {wallet && wallet.last_transactions.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Wallet className="h-8 w-8 mx-auto text-muted-foreground mb-2" aria-hidden />
            <p className="text-sm text-muted-foreground mb-3">
              Sua primeira recarga aparece aqui.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/carteira/recarregar">Adicionar créditos</Link>
            </Button>
          </div>
        )}

        <ul className="space-y-2">
          {wallet?.last_transactions.map((tx) => (
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
                  <p className="font-medium text-sm">
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
      </section>
    </div>
  );
}
