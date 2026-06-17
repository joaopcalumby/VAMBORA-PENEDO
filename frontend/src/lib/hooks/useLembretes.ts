"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { api } from "@/lib/api";
import type { ReminderResponse, SchedulesByDay } from "@/lib/types";

// Agenda notificações locais para todos os lembretes ativos do usuário.
//
// Estratégia simples para o MVP:
// - Ao montar (no layout autenticado), busca /lembretes.
// - Para cada lembrete ativo, calcula o próximo horário oficial da linha
//   e agenda um setTimeout para (horário - antecedência) chamando
//   new Notification(...).
// - Limites conhecidos: setTimeout segura até ~24 dias; agendamentos
//   após esse limite são ignorados — adequado para janelas curtas do MVP.
// - Quando o navegador estiver totalmente fechado, a notificação não
//   dispara (ver decisão 10 do design.md).

export function useLembretes() {
  const { data: session, status } = useSession();
  const token = session?.backendToken ?? null;

  useEffect(() => {
    if (status !== "authenticated" || !token) return;

    const timeouts: number[] = [];
    let cancelled = false;

    (async () => {
      const reminders = await api<ReminderResponse[]>("/lembretes", { token }).catch(
        () => [] as ReminderResponse[]
      );
      if (cancelled) return;

      for (const r of reminders) {
        if (!r.active) continue;
        const next = await nextDepartureFor(r.line_id, token).catch(() => null);
        if (cancelled || !next) continue;

        const targetMs =
          new Date(next.iso).getTime() - r.anticipation_minutes * 60_000;
        const delay = targetMs - Date.now();
        if (delay <= 0 || delay > 2_147_483_647) continue;

        const id = window.setTimeout(() => {
          if (canNotify()) {
            new Notification("Vambora Penedo", {
              body: `Linha ${r.line_id}: próximo em ${r.anticipation_minutes} min`,
              tag: `lembrete-${r.id}`,
            });
          }
        }, delay);
        timeouts.push(id);
      }
    })();

    return () => {
      cancelled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [status, token]);
}

function canNotify(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
}

type NextLocal = { iso: string };

async function nextDepartureFor(lineId: number, token: string): Promise<NextLocal | null> {
  const schedules = await api<SchedulesByDay>(`/linhas/${lineId}/horarios`, { token });
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const allToday = schedules.weekday.concat(schedules.saturday, schedules.sunday_holiday);
  // Sem feriados — usar o dia da semana atual para escolher a lista.
  const day = now.getDay(); // 0=domingo
  const list =
    day === 0 ? schedules.sunday_holiday : day === 6 ? schedules.saturday : schedules.weekday;
  for (const hhmm of list.length > 0 ? list : allToday) {
    const iso = `${today}T${hhmm.slice(0, 8)}-03:00`; // America/Maceio fixo
    if (new Date(iso).getTime() > now.getTime()) return { iso };
  }
  return null;
}
