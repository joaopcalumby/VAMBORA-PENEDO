"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApi } from "@/lib/hooks/useApi";
import { ApiError } from "@/lib/api";
import type { LineSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type Type = "problem" | "suggestion";

export default function FeedbackPage() {
  const callApi = useApi();
  const [type, setType] = useState<Type>("problem");
  const [message, setMessage] = useState("");
  const [lineId, setLineId] = useState<number | "">("");
  const [lines, setLines] = useState<LineSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    callApi<LineSummary[]>("/linhas").then(setLines).catch(() => setLines([]));
  }, [callApi]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 10) {
      setError("Conte com pelo menos 10 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      await callApi("/feedback", {
        method: "POST",
        body: {
          type,
          message: message.trim(),
          line_id: lineId === "" ? null : lineId,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600" />
        <h1 className="text-xl font-semibold">Recebemos seu feedback. Obrigado!</h1>
        <Button asChild className="mt-4">
          <Link href="/perfil">Voltar ao perfil</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link href="/perfil">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Enviar feedback</h1>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Tipo</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["problem", "suggestion"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-md border h-11 text-sm",
                  type === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-accent/40"
                )}
              >
                {t === "problem" ? "Reportar problema" : "Sugestão"}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="line">Linha relacionada (opcional)</Label>
          <select
            id="line"
            value={lineId}
            onChange={(e) =>
              setLineId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full rounded-md border border-input bg-background h-11 px-3 text-sm"
          >
            <option value="">— Nenhuma —</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.number} — {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensagem (10–1000 caracteres)</Label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={1000}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length} / 1000
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </div>
  );
}
