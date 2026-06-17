// Constantes e helpers do mapa interativo.

import type { StopSummary } from "@/lib/types";

// Centro aproximado de Penedo–AL — usado como fallback quando a
// geolocalização não está disponível ou foi negada.
export const PENEDO_CENTER: [number, number] = [-36.5854, -10.291];
export const PENEDO_INITIAL_ZOOM = 13;

// Estilo de tiles open-source da CartoDB (sem chave). Carto serve sob
// licença ODbL com OSM data — citação no rodapé é boa prática.
export const TILE_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// Cor do traçado de cada modal — usar tokens da paleta deep-saffron para
// linhas de ônibus mantém consistência com o resto da UI; van fica em
// azul (token semântico ainda neutro) e balsa em verde.
export const MODAL_COLOR: Record<string, string> = {
  bus: "#f99006",
  van: "#2563eb",
  ferry: "#0ea5e9",
};

export const MODAL_BG: Record<string, string> = {
  bus: "#fee9cd",
  van: "#dbeafe",
  ferry: "#e0f2fe",
};

// Haversine simplificado: distância aproximada em metros entre duas
// coordenadas (lat, lng). Suficiente para "ponto mais próximo" — não
// precisa de elipsóide para distâncias < 100 km.
export function haversineMeters(
  a: [number, number],
  b: [number, number]
): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const s1 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1));
}

export function closestStop(
  stops: StopSummary[],
  user: [number, number]
): StopSummary | null {
  if (stops.length === 0) return null;
  let best = stops[0];
  let bestDist = haversineMeters(user, [best.latitude, best.longitude]);
  for (const s of stops.slice(1)) {
    const d = haversineMeters(user, [s.latitude, s.longitude]);
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}
