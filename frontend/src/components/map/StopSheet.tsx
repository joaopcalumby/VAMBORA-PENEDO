"use client";

import { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/useApi";
import {
  MODAL_LABEL,
  formatMinutesUntil,
  formatTime,
} from "@/lib/format";
import type { StopDetail } from "@/lib/types";

type Props = {
  stopId: number;
  onClose: () => void;
};

// Painel inferior deslizável simples (Sheet bottom). Aberto via setState
// no parent quando o usuário clica num marcador. Esc/click fora fecha.
export function StopSheet({ stopId, onClose }: Props) {
  const callApi = useApi();
  const [detail, setDetail] = useState<StopDetail | null>(null);
  const [reminderFor, setReminderFor] = useState<number | null>(null);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);

  useEffect(() => {
    callApi<StopDetail>(`/pontos/${stopId}`).then(setDetail).catch(() => setDetail(null));
  }, [callApi, stopId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function createReminder(lineId: number, minutes: number) {
    setReminderMsg(null);
    try {
      await callApi("/lembretes", {
        method: "POST",
        body: { line_id: lineId, stop_id: stopId, anticipation_minutes: minutes },
      });
      setReminderMsg("Lembrete criado.");
      setReminderFor(null);
    } catch {
      setReminderMsg("Não foi possível criar o lembrete.");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalhe do ponto"
      className="fixed inset-x-0 bottom-0 z-50 max-h-[75dvh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{detail?.name ?? "Carregando..."}</h2>
          {detail && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {MODAL_LABEL[detail.modal] ?? detail.modal}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar painel"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <section className="mt-4 space-y-3">
        <h3 className="text-sm font-medium">Linhas que passam aqui</h3>
        {detail && detail.lines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma linha cadastrada para este ponto.
          </p>
        )}
        <ul className="space-y-2">
          {detail?.lines.map((line) => (
            <li
              key={line.id}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    <span className="text-xs rounded bg-primary-100 px-1.5 py-0.5 text-primary-800 mr-2">
                      {line.number}
                    </span>
                    {line.name}
                  </p>
                  {line.next_departure ? (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Próximo {formatTime(line.next_departure.departure_time)}
                      {line.next_departure.same_day
                        ? ` (${formatMinutesUntil(line.next_departure.minutes_until)})`
                        : " — amanhã"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sem horários.</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setReminderFor((cur) => (cur === line.id ? null : line.id))
                  }
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  <span>Avise-me</span>
                </Button>
              </div>

              {reminderFor === line.id && (
                <div className="mt-3 flex gap-2">
                  {[5, 10, 15].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => createReminder(line.id, m)}
                      className="flex-1 rounded-md border border-border bg-background h-9 text-sm hover:bg-accent/40"
                    >
                      {m} min antes
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        {reminderMsg && (
          <p role="status" className="text-sm text-muted-foreground">
            {reminderMsg}
          </p>
        )}
      </section>
    </div>
  );
}
