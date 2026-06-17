"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, CheckCircle2, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/useApi";
import { ApiError } from "@/lib/api";
import { formatCents } from "@/lib/format";
import type {
  PaymentConfirmResponse,
  PaymentPreviewResponse,
} from "@/lib/types";

const QrScanner = dynamic(
  () => import("@/components/wallet/QrScanner").then((m) => m.QrScanner),
  { ssr: false }
);

type Phase = "scanning" | "preview" | "success" | "error";

export default function PagarPage() {
  const router = useRouter();
  const callApi = useApi();

  const [phase, setPhase] = useState<Phase>("scanning");
  const [preview, setPreview] = useState<PaymentPreviewResponse | null>(null);
  const [receipt, setReceipt] = useState<PaymentConfirmResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleDecoded(code: string) {
    if (phase !== "scanning") return;
    setSubmitting(true);
    try {
      const data = await callApi<PaymentPreviewResponse>("/pagamento/preview", {
        method: "POST",
        body: { code },
      });
      setPreview(data);
      setPhase("preview");
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "QR inválido.");
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirm() {
    if (!preview) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // Reusamos o code do QR original — não temos ele no preview;
      // refazemos preview->confirmar separados. Aqui simplificamos
      // chamando confirmar com o mesmo code; em produção, guardar
      // o code no estado entre os dois passos.
      const data = await callApi<PaymentConfirmResponse>("/pagamento/confirmar", {
        method: "POST",
        body: { code: codeRef.current },
      });
      setReceipt(data);
      setPhase("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setErrorMsg("Saldo insuficiente.");
        setPhase("error");
      } else {
        setErrorMsg(err instanceof ApiError ? err.message : "Erro ao confirmar.");
        setPhase("error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // O preview/confirmar precisam do code original. Armazenamos em
  // useRef para não disparar re-render quando o QR é lido.
  const codeRef = useRef<string>("");

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6 min-h-dvh">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link href="/carteira">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Pagar passagem</h1>
      </div>

      {phase === "scanning" && (
        <>
          <p className="text-sm text-muted-foreground text-center">
            Aponte a câmera para o QR Code do motorista.
          </p>
          <QrScanner
            onDecoded={(code) => {
              codeRef.current = code;
              handleDecoded(code);
            }}
            onError={(m) => {
              setErrorMsg(m);
              setPhase("error");
            }}
          />
        </>
      )}

      {phase === "preview" && preview && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Confirmar pagamento
          </p>
          <p className="text-3xl font-semibold tabular-nums">
            {formatCents(preview.amount_cents)}
          </p>
          <dl className="text-sm space-y-1">
            <Row label="Linha">{preview.line_number} — {preview.line_name}</Row>
            <Row label="Motorista">{preview.driver_name}</Row>
            <Row label="Categoria">{preview.user_category_slug}</Row>
          </dl>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPhase("scanning");
                setPreview(null);
              }}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={confirm} disabled={submitting}>
              {submitting ? "Pagando..." : "Confirmar"}
            </Button>
          </div>
        </section>
      )}

      {phase === "success" && receipt && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-800 p-5 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600" />
          <h2 className="text-lg font-semibold">Passagem paga!</h2>
          <p className="text-sm">
            {receipt.line_number} — {receipt.line_name}
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCents(receipt.amount_cents)}
          </p>
          <p className="text-xs text-muted-foreground">
            Saldo restante: {formatCents(receipt.new_balance_cents)}
          </p>
          <Button asChild className="w-full mt-2">
            <Link href="/carteira">Voltar para a carteira</Link>
          </Button>
        </section>
      )}

      {phase === "error" && (
        <section className="rounded-xl border border-destructive bg-destructive/10 p-5 space-y-4 text-center">
          <p className="font-semibold">{errorMsg ?? "Erro inesperado."}</p>

          {errorMsg === "Saldo insuficiente." && (
            <Button asChild className="w-full">
              <Link href="/carteira/recarregar">
                <WalletCards className="h-4 w-4 mr-2" />
                Recarregar agora
              </Link>
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.replace("/carteira")}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setErrorMsg(null);
                setPreview(null);
                setReceipt(null);
                setPhase("scanning");
              }}
            >
              Tentar novamente
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{children}</dd>
    </div>
  );
}

