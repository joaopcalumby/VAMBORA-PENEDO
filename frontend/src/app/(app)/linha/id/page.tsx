"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bell, Info, MapPin, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/useApi";
import {
  FavoriteResponse,
  LineSummary,
  NextDeparture,
  SchedulesByDay,
  StopSummary,
} from "@/lib/types";
import {
  MODAL_LABEL,
  formatCents,
  formatMinutesUntil,
  formatTime,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const ANTICIPATION_OPTIONS = [5, 10, 15] as const;

export default function LinhaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const lineId = Number(params.id);
  const callApi = useApi();

  const [line, setLine] = useState<LineSummary | null>(null);
  const [next, setNext] = useState<NextDeparture | null>(null);
  const [schedules, setSchedules] = useState<SchedulesByDay | null>(null);
  const [stops, setStops] = useState<StopSummary[]>([]);
  const [favorite, setFavorite] = useState<FavoriteResponse | null>(null);

  const [showRemind, setShowRemind] = useState(false);
  const [selectedStop, setSelectedStop] = useState<number | "">("");
  const [minutes, setMinutes] = useState<number>(10);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(lineId)) return;
    callApi<LineSummary>(`/linhas/${lineId}`).then(setLine).catch(() => setLine(null));
    callApi<NextDeparture | null>(`/linhas/${lineId}/proximo`).then(setNext).catch(() => setNext(null));
    callApi<SchedulesByDay>(`/linhas/${lineId}/horarios`).then(setSchedules).catch(() => setSchedules(null));
    callApi<StopSummary[]>(`/pontos?line_id=${lineId}`).then(setStops).catch(() => setStops([]));
    callApi<FavoriteResponse[]>("/favoritos")
      .then((favs) => setFavorite(favs.find((f) => f.target_type === "line" && f.target_id === lineId) ?? null))
      .catch(() => setFavorite(null));
  }, [callApi, lineId]);

  async function toggleFavorite() {
    if (favorite) {
      await callApi(`/favoritos/${favorite.id}`, { method: "DELETE" });
      setFavorite(null);
      return;
    }
    const created = await callApi<FavoriteResponse>("/favoritos", {
      method: "POST",
      body: { target_type: "line", target_id: lineId },
    });
    setFavorite(created);
  }

  async function createReminder() {
    if (!selectedStop) return;
    setReminderMsg(null);
    try {
      await callApi("/lembretes", {
        method: "POST",
        body: { line_id: lineId, stop_id: selectedStop, anticipation_minutes: minutes },
      });
      setReminderMsg("Lembrete criado.");
      setShowRemind(false);
    } catch {
      setReminderMsg("Não foi possível criar o lembrete.");
    }
  }

  const modalLabel = useMemo(
    () => (line ? MODAL_LABEL[line.modal] ?? line.modal : ""),
    [line]
  );

  if (!Number.isFinite(lineId)) {
    return <p className="p-4 text-sm text-muted-foreground">Linha inválida.</p>;
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Button>
        <h1 className="text-lg font-semibold truncate">
          {line ? `${line.number} — ${line.name}` : "Carregando..."}
        </h1>
      </div>

      {line && (
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{modalLabel}</p>
      )}

      <NextDepartureBlock next={next} />

      <ActionRow
        favorite={!!favorite}
        onToggleFavorite={toggleFavorite}
        onRemind={() => setShowRemind((v) => !v)}
        onMap={() => router.push(`/mapa?linha=${lineId}`)}
      />

      {showRemind && (
        <RemindForm
          stops={stops}
          selectedStop={selectedStop}
          onSelectStop={setSelectedStop}
          minutes={minutes}
          onSelectMinutes={setMinutes}
          onSubmit={createReminder}
          message={reminderMsg}
        />
      )}

      <SchedulesBlock schedules={schedules} />

      {line && <TarifaBlock line={line} />}
    </div>
  );
}

function NextDepartureBlock({ next }: { next: NextDeparture | null }) {
  if (!next) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Sem horários por enquanto.</p>
      </section>
    );
  }
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Próximo ônibus
          </p>
          <p className="text-2xl font-semibold">{formatTime(next.departure_time)}</p>
          <p className="text-sm text-muted-foreground">
            {next.same_day ? formatMinutesUntil(next.minutes_until) : "Amanhã"}
          </p>
        </div>
        <span title="Estimativa baseada em fonte oficial" className="text-muted-foreground">
          <Info className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Os horários são estimativas e podem variar.
      </p>
    </section>
  );
}

function ActionRow(props: {
  favorite: boolean;
  onToggleFavorite: () => void;
  onRemind: () => void;
  onMap: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button variant="outline" onClick={props.onToggleFavorite} className="flex-col gap-1 h-auto py-3">
        <Star className={cn("h-5 w-5", props.favorite && "fill-primary text-primary")} aria-hidden />
        <span className="text-xs">{props.favorite ? "Salva" : "Salvar"}</span>
      </Button>
      <Button variant="outline" onClick={props.onRemind} className="flex-col gap-1 h-auto py-3">
        <Bell className="h-5 w-5" aria-hidden />
        <span className="text-xs">Avise-me</span>
      </Button>
      <Button variant="outline" onClick={props.onMap} className="flex-col gap-1 h-auto py-3">
        <MapPin className="h-5 w-5" aria-hidden />
        <span className="text-xs">Ver no mapa</span>
      </Button>
    </div>
  );
}

function RemindForm(props: {
  stops: StopSummary[];
  selectedStop: number | "";
  onSelectStop: (v: number | "") => void;
  minutes: number;
  onSelectMinutes: (n: number) => void;
  onSubmit: () => void;
  message: string | null;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h2 className="font-semibold">Criar lembrete</h2>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="stop">
          Ponto
        </label>
        <select
          id="stop"
          value={props.selectedStop}
          onChange={(e) =>
            props.onSelectStop(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full rounded-md border border-input bg-background h-11 px-3 text-sm"
        >
          <option value="">Selecione um ponto</option>
          {props.stops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Avise-me com antecedência:</p>
        <div className="flex gap-2">
          {ANTICIPATION_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => props.onSelectMinutes(m)}
              className={cn(
                "flex-1 rounded-md border h-10 text-sm transition-colors",
                props.minutes === m
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent/40"
              )}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      <Button onClick={props.onSubmit} className="w-full" disabled={!props.selectedStop}>
        Ativar lembrete
      </Button>

      {props.message && (
        <p role="status" className="text-sm text-muted-foreground">
          {props.message}
        </p>
      )}
    </section>
  );
}

function SchedulesBlock({ schedules }: { schedules: SchedulesByDay | null }) {
  if (!schedules) {
    return <p className="text-sm text-muted-foreground">Carregando horários...</p>;
  }
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Horários</h2>
      <DayGroup title="Dias úteis" times={schedules.weekday} />
      <DayGroup title="Sábado" times={schedules.saturday} />
      <DayGroup title="Domingo / Feriado" times={schedules.sunday_holiday} />
    </section>
  );
}

function DayGroup({ title, times }: { title: string; times: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium mb-1">{title}</p>
      {times.length === 0 ? (
        <p className="text-sm text-muted-foreground">Não opera nesse dia.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {times.map((t) => (
            <span
              key={t}
              className="text-xs rounded bg-muted px-2 py-1 text-foreground tabular-nums"
            >
              {formatTime(t)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TarifaBlock({ line }: { line: LineSummary }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Tarifa padrão</p>
        <p className="text-lg font-semibold">{formatCents(line.default_price_cents)}</p>
      </div>
    </section>
  );
}
