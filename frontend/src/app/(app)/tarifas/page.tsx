"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bus, Sailboat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/useApi";
import { MODAL_LABEL, formatCents } from "@/lib/format";
import type { LineSummary } from "@/lib/types";

const ICON: Record<string, typeof Bus> = {
  bus: Bus,
  van: Bus,
  ferry: Sailboat,
};

export default function TarifasPage() {
  const callApi = useApi();
  const [lines, setLines] = useState<LineSummary[] | null>(null);

  useEffect(() => {
    callApi<LineSummary[]>("/linhas").then(setLines).catch(() => setLines([]));
  }, [callApi]);

  // Agrupa por modal para apresentação informativa (PRD §3.3).
  const grouped = (lines ?? []).reduce<Record<string, LineSummary[]>>(
    (acc, line) => {
      (acc[line.modal] ??= []).push(line);
      return acc;
    },
    {}
  );

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link href="/perfil">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Tarifas</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Valores padrão por modal. Categorias com desconto pagam menos —
        consulte a sua na seção <Link href="/perfil/categoria" className="text-primary underline">Categoria tarifária</Link>.
      </p>

      {lines === null && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {Object.entries(grouped).map(([modal, lines]) => {
        const Icon = ICON[modal] ?? Bus;
        return (
          <section key={modal} className="space-y-2">
            <h2 className="font-semibold flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              {MODAL_LABEL[modal] ?? modal}
            </h2>
            <ul className="space-y-2">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <span className="text-sm">
                    <span className="text-xs rounded bg-primary-100 px-1.5 py-0.5 text-primary-800 mr-2">
                      {line.number}
                    </span>
                    {line.name}
                  </span>
                  <span className="font-semibold tabular-nums text-right">
                    {line.modal === "ferry" ? (
                      <span className="flex flex-col text-xs font-normal text-muted-foreground items-end gap-1">
                        <span><span className="font-semibold text-foreground">Pedestre:</span> R$ 5,00</span>
                        <span><span className="font-semibold text-foreground">Moto:</span> R$ 10,00</span>
                        <span><span className="font-semibold text-foreground">Carro:</span> R$ 40,00</span>
                      </span>
                    ) : (
                      formatCents(line.default_price_cents)
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h2 className="font-semibold">Formas de pagamento</h2>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Carteira interna (crédito recarregado no app)</li>
          <li>Outras formas dependem do operador da linha.</li>
        </ul>
      </section>
    </div>
  );
}
