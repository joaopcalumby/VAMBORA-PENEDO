"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Bus, Sailboat, Trash2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/useApi";
import { MODAL_LABEL, formatMinutesUntil, formatTime } from "@/lib/format";
import type {
  FavoriteResponse,
  LineSummary,
  NextDeparture,
  StopSummary,
} from "@/lib/types";

const MODAL_ICON = { bus: Bus, van: Bus, ferry: Sailboat } as const;

type LineFavorite = FavoriteResponse & {
  line: LineSummary;
  nextDeparture: NextDeparture | null;
};

type StopFavorite = FavoriteResponse & {
  stop: StopSummary;
};

export default function FavoritosPage() {
  const { status } = useSession();
  const callApi = useApi();
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  const [lineFavs, setLineFavs] = useState<LineFavorite[]>([]);
  const [stopFavs, setStopFavs] = useState<StopFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    callApi<FavoriteResponse[]>("/favoritos")
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [callApi, status]);

  useEffect(() => {
    const lineIds = favorites
      .filter((f) => f.target_type === "line")
      .map((f) => f.target_id);
    const stopIds = favorites
      .filter((f) => f.target_type === "stop")
      .map((f) => f.target_id);

    // Reusa um único GET /linhas — preço de O(n) trivial para o MVP.
    if (lineIds.length > 0) {
      callApi<LineSummary[]>("/linhas")
        .then(async (all) => {
          const byId = new Map(all.map((l) => [l.id, l]));
          const result: LineFavorite[] = [];
          for (const fav of favorites.filter((f) => f.target_type === "line")) {
            const line = byId.get(fav.target_id);
            if (!line) continue;
            let nextDep: NextDeparture | null = null;
            try {
              nextDep = await callApi<NextDeparture | null>(
                `/linhas/${line.id}/proximo`
              );
            } catch {
              // sem horários cadastrados
            }
            result.push({ ...fav, line, nextDeparture: nextDep });
          }
          setLineFavs(result);
        })
        .catch(() => setLineFavs([]));
    } else {
      setLineFavs([]);
    }

    if (stopIds.length > 0) {
      Promise.all(
        stopIds.map((id) =>
          callApi<StopSummary>(`/pontos/${id}`).catch(() => null)
        )
      ).then((stops) => {
        const valid: StopFavorite[] = [];
        favorites
          .filter((f) => f.target_type === "stop")
          .forEach((fav, idx) => {
            const stop = stops[idx];
            if (stop) valid.push({ ...fav, stop });
          });
        setStopFavs(valid);
      });
    } else {
      setStopFavs([]);
    }
  }, [callApi, favorites]);

  async function remove(favoriteId: number) {
    await callApi(`/favoritos/${favoriteId}`, { method: "DELETE" });
    setFavorites((cur) => cur.filter((f) => f.id !== favoriteId));
  }

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Carregando...</p>;
  }

  const empty = lineFavs.length === 0 && stopFavs.length === 0;

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link href="/inicio">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Seus favoritos</h1>
      </div>

      {empty && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Você ainda não salvou linhas ou pontos. Salve no detalhe da linha
          (estrela) ou no painel do ponto.
        </p>
      )}

      {lineFavs.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Linhas</h2>
          <ul className="space-y-2">
            {lineFavs.map((fav) => {
              const Icon = MODAL_ICON[fav.line.modal as keyof typeof MODAL_ICON] ?? Bus;
              return (
                <li
                  key={fav.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <Link href={`/linha/${fav.line.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-md bg-primary-50 p-2 text-primary-700 dark:bg-primary-900 dark:text-primary-200 shrink-0">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {MODAL_LABEL[fav.line.modal] ?? fav.line.modal} · {fav.line.number}
                      </p>
                      <p className="font-medium truncate">{fav.line.name}</p>
                      {fav.nextDeparture && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          Próximo {formatTime(fav.nextDeparture.departure_time)}
                          {fav.nextDeparture.same_day &&
                            ` (${formatMinutesUntil(fav.nextDeparture.minutes_until)})`}
                        </p>
                      )}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover favorito"
                    onClick={() => remove(fav.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {stopFavs.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Pontos</h2>
          <ul className="space-y-2">
            {stopFavs.map((fav) => (
              <li
                key={fav.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="rounded-md bg-primary-50 p-2 text-primary-700 dark:bg-primary-900 dark:text-primary-200 shrink-0">
                    <MapPin className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {MODAL_LABEL[fav.stop.modal] ?? fav.stop.modal}
                    </p>
                    <p className="font-medium truncate">{fav.stop.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover favorito"
                  onClick={() => remove(fav.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
