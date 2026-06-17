"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/useApi";
import { closestStop } from "@/lib/map";
import { cn } from "@/lib/utils";
import type { LineSummary, StopSummary } from "@/lib/types";
import type { RoutePolyline } from "@/components/map/MapView";
import { StopSheet } from "@/components/map/StopSheet";

// MapLibre toca window/document — carregamento dinâmico sem SSR.
const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-muted" /> }
);

type RouteResponse = {
  id: number;
  line_id: number;
  points: { sequence: number; latitude: number; longitude: number }[];
};

export default function MapaPage() {
  const params = useSearchParams();
  const initialLineId = params.get("linha");
  const callApi = useApi();

  const [lines, setLines] = useState<LineSummary[]>([]);
  const [stops, setStops] = useState<StopSummary[]>([]);
  const [activeLines, setActiveLines] = useState<Set<number>>(new Set());
  const [routes, setRoutes] = useState<Record<number, RoutePolyline>>({});
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [openStop, setOpenStop] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    callApi<LineSummary[]>("/linhas").then(setLines).catch(() => setLines([]));
    callApi<StopSummary[]>("/pontos").then(setStops).catch(() => setStops([]));
  }, [callApi]);

  // Pre-ativar a linha de ?linha=ID (vindo do detalhe).
  useEffect(() => {
    if (initialLineId === null) return;
    const id = Number(initialLineId);
    if (!Number.isFinite(id)) return;
    setActiveLines((prev) => new Set(prev).add(id));
  }, [initialLineId]);

  // Carrega/descarrega rotas conforme linhas ativas mudam.
  useEffect(() => {
    activeLines.forEach((id) => {
      if (routes[id]) return;
      callApi<RouteResponse>(`/linhas/${id}/rota`)
        .then((data) => {
          const modal = lines.find((l) => l.id === id)?.modal ?? "bus";
          setRoutes((cur) => ({
            ...cur,
            [id]: { lineId: id, modal, points: data.points },
          }));
        })
        .catch(() => {
          // Linha sem rota cadastrada — silencioso.
        });
    });
  }, [activeLines, callApi, lines, routes]);

  const visibleRoutes = useMemo(
    () => Array.from(activeLines).map((id) => routes[id]).filter(Boolean) as RoutePolyline[],
    [activeLines, routes]
  );

  function toggleLine(id: number) {
    setActiveLines((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function locateMe() {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocalização indisponível neste dispositivo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);
        const closest = closestStop(stops, [lat, lng]);
        if (closest) setHighlight(closest.id);
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Ative nas configurações do navegador."
            : "Não foi possível obter sua localização.";
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="relative h-[calc(100dvh-4rem)]">
      <MapView
        stops={stops}
        routes={visibleRoutes}
        userLocation={userLocation}
        highlightStopId={highlight}
        onStopClick={(s) => setOpenStop(s.id)}
      />

      {/* Chips de linhas (topo) */}
      <div
        className="absolute top-3 left-3 right-3 z-10 pointer-events-none"
        aria-label="Seletor de linhas"
      >
        <div className="pointer-events-auto flex gap-2 overflow-x-auto rounded-full bg-background/90 backdrop-blur px-2 py-2 shadow-lg">
          {lines.length === 0 && (
            <span className="px-2 py-1 text-xs text-muted-foreground">Sem linhas.</span>
          )}
          {lines.map((line) => {
            const active = activeLines.has(line.id);
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => toggleLine(line.id)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 rounded-full px-3 h-8 text-sm transition-colors border",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-accent/40"
                )}
              >
                {line.number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Botão "Minha localização" */}
      <Button
        type="button"
        onClick={locateMe}
        size="icon"
        variant="default"
        aria-label="Minha localização"
        className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full shadow-lg"
      >
        <LocateFixed className="h-5 w-5" />
      </Button>

      {geoError && (
        <div
          role="alert"
          className="absolute bottom-20 left-3 right-3 z-10 rounded-lg bg-destructive/95 text-destructive-foreground p-3 text-sm shadow-lg"
        >
          {geoError}
        </div>
      )}

      {openStop !== null && (
        <StopSheet stopId={openStop} onClose={() => setOpenStop(null)} />
      )}
    </div>
  );
}
