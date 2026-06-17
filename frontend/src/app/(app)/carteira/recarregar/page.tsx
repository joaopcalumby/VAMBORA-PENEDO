"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/lib/hooks/useApi";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

const QUICK = [5_00, 10_00, 20_00, 50_00] as const;

export default function RecarregarPage() {
  const router = useRouter();
  const callApi = useApi();
  const [selected, setSelected] = useState<number | null>(20_00);
  const [custom, setCustom] = useState("");
  const [pixVisible, setPixVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = selected ?? Math.round(Number(custom.replace(",", ".")) * 100);
  const valid = amountCents > 0 && Number.isFinite(amountCents);

  async function confirmPayment() {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await callApi("/carteira/recarga", {
        method: "POST",
        body: { amount_cents: amountCents },
      });
      router.replace("/carteira");
    } catch {
      setError("Não foi possível concluir a recarga.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link href="/carteira">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Adicionar créditos</h1>
      </div>

      <div
        role="alert"
        className="rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 p-3 text-sm text-amber-900 dark:text-amber-100 flex gap-2"
      >
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>Demonstração — não há cobrança real nesta versão.</p>
      </div>

      {!pixVisible && (
        <>
          <section className="space-y-3">
            <p className="text-sm font-medium">Escolha um valor</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setSelected(v);
                    setCustom("");
                  }}
                  className={cn(
                    "rounded-lg border h-14 text-base font-semibold tabular-nums transition-colors",
                    selected === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-accent/40"
                  )}
                >
                  {formatCents(v)}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <Label htmlFor="custom">Ou valor personalizado</Label>
            <Input
              id="custom"
              inputMode="decimal"
              placeholder="0,00"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setSelected(null);
              }}
            />
          </section>

          <Button
            className="w-full"
            size="lg"
            disabled={!valid}
            onClick={() => setPixVisible(true)}
          >
            Gerar PIX
          </Button>
        </>
      )}

      {pixVisible && (
        <section className="space-y-4 text-center">
          <div className="rounded-xl border border-border bg-card p-6 mx-auto flex flex-col items-center gap-3">
            <div
              aria-hidden
              className="grid grid-cols-12 gap-0.5 w-48 h-48"
            >
              {Array.from({ length: 144 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    Math.random() > 0.5
                      ? "bg-foreground"
                      : "bg-background"
                  }
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <QrCode className="h-3.5 w-3.5" /> Mock — sem leitura real
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCents(amountCents)}
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setPixVisible(false)}
              disabled={submitting}
            >
              Voltar
            </Button>
            <Button className="flex-1" onClick={confirmPayment} disabled={submitting}>
              {submitting ? "Confirmando..." : "Confirmar pagamento"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
