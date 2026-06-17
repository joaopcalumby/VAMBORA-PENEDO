"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/useApi";
import type {
  LineSummary,
  ReminderResponse,
  StopSummary,
} from "@/lib/types";

type Enriched = ReminderResponse & {
  lineName?: string;
  stopName?: string;
};

export function RemindersList() {
  const callApi = useApi();
  const [reminders, setReminders] = useState<Enriched[]>([]);

  useEffect(() => {
    (async () => {
      let raw: ReminderResponse[] = [];
      try {
        raw = await callApi<ReminderResponse[]>("/lembretes");
      } catch {
        return;
      }
      // Enriquece com nomes via paralelo, sem cache central — N×2 GETs
      // é OK pra MVP com poucos lembretes.
      const lines = await callApi<LineSummary[]>("/linhas").catch(() => []);
      const lineMap = new Map(lines.map((l) => [l.id, l.name]));
      const enriched = await Promise.all(
        raw.map(async (r) => {
          const stop = await callApi<StopSummary>(`/pontos/${r.stop_id}`).catch(
            () => null
          );
          return {
            ...r,
            lineName: lineMap.get(r.line_id),
            stopName: stop?.name,
          } satisfies Enriched;
        })
      );
      setReminders(enriched);
    })();
  }, [callApi]);

  async function toggle(id: number, active: boolean) {
    await callApi(`/lembretes/${id}`, { method: "PATCH", body: { active } });
    setReminders((cur) => cur.map((r) => (r.id === id ? { ...r, active } : r)));
  }

  async function remove(id: number) {
    await callApi(`/lembretes/${id}`, { method: "DELETE" });
    setReminders((cur) => cur.filter((r) => r.id !== id));
  }

  if (reminders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem lembretes ativos. Crie um no detalhe da linha ou no painel do ponto.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {reminders.map((r) => (
        <li
          key={r.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label={r.active ? "Desligar lembrete" : "Ligar lembrete"}
            onClick={() => toggle(r.id, !r.active)}
          >
            {r.active ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {r.lineName ?? `Linha #${r.line_id}`}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {r.stopName ?? `Ponto #${r.stop_id}`} · {r.anticipation_minutes} min antes
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remover lembrete"
            onClick={() => remove(r.id)}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </li>
      ))}
      <p className="text-xs text-muted-foreground">
        Os horários são estimativas baseadas em fonte oficial e podem variar.
      </p>
    </ul>
  );
}
