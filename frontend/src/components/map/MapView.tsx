"use client";

import { useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap, Marker } from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

import {
  MODAL_BG,
  MODAL_COLOR,
  PENEDO_CENTER,
  PENEDO_INITIAL_ZOOM,
  TILE_STYLE,
} from "@/lib/map";
import type { StopSummary } from "@/lib/types";

export type RoutePolyline = {
  lineId: number;
  modal: string;
  points: { latitude: number; longitude: number; sequence: number }[];
};

export type MapViewProps = {
  stops: StopSummary[];
  routes: RoutePolyline[];
  userLocation: [number, number] | null;
  highlightStopId: number | null;
  onStopClick?: (stop: StopSummary) => void;
};

// Wrapper estilo "mapcn": MapLibre + estilos do Carto, marcadores DOM
// (mais leve que symbols pra <200 paradas), traçados como camadas
// GeoJSON gerenciadas via setData.
export function MapView({
  stops,
  routes,
  userLocation,
  highlightStopId,
  onStopClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const stopMarkersRef = useRef<Map<number, Marker>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);

  // Bootstrap do mapa (uma vez).
  useEffect(() => {
    window.onerror = function (msg, url, line) {
      alert("Error: " + msg + "\nLine: " + line);
    };
    if (!containerRef.current || mapRef.current) return;

    console.log("Map container clientHeight:", containerRef.current.clientHeight, "clientWidth:", containerRef.current.clientWidth);

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: TILE_STYLE,
      center: PENEDO_CENTER,
      zoom: PENEDO_INITIAL_ZOOM,
      attributionControl: { compact: true },
    });
    
    console.log("Map instance created.", map);
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // Força a atualização do tamanho do canvas logo após o carregamento
      // para evitar tela em branco.
      map.resize();
      
      // Camada de rotas (vazia até receber dados).
      map.addSource("routes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "routes",
        paint: {
          "line-width": 4,
          "line-color": ["coalesce", ["get", "color"], "#f99006"],
          "line-opacity": 0.85,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      stopMarkersRef.current.clear();
      userMarkerRef.current = null;
    };
  }, []);

  // Sincroniza os marcadores de paradas.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = stopMarkersRef.current;
    const seen = new Set<number>();
    for (const stop of stops) {
      seen.add(stop.id);
      const existingMarker = existing.get(stop.id);
      if (existingMarker) continue;

      const el = document.createElement("button");
      el.setAttribute("type", "button");
      el.setAttribute("aria-label", `Ponto ${stop.name}`);
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "9999px";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4)";
      el.style.background = MODAL_COLOR[stop.modal] ?? "#737373";
      el.style.cursor = "pointer";
      el.dataset.stopId = String(stop.id);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onStopClick?.(stop);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map);
      existing.set(stop.id, marker);
    }

    // Remove marcadores que não estão mais na lista.
    for (const [id, marker] of existing.entries()) {
      if (!seen.has(id)) {
        marker.remove();
        existing.delete(id);
      }
    }
  }, [stops, onStopClick]);

  // Destaca o ponto mais próximo (visual).
  useEffect(() => {
    const existing = stopMarkersRef.current;
    existing.forEach((marker, id) => {
      const el = marker.getElement();
      if (id === highlightStopId) {
        el.style.outline = "3px solid #f99006";
        el.style.outlineOffset = "2px";
      } else {
        el.style.outline = "";
        el.style.outlineOffset = "";
      }
    });
  }, [highlightStopId]);

  // Marcador do usuário.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (!userLocation) return;
    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "9999px";
    el.style.background = "#2563eb";
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.25)";
    userMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([userLocation[1], userLocation[0]])
      .addTo(map);
  }, [userLocation]);

  // Sincroniza GeoJSON das rotas.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("routes") as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features: routes
        .filter((r) => r.points && r.points.length >= 2)
        .map((r) => ({
        type: "Feature",
        properties: { lineId: r.lineId, color: MODAL_COLOR[r.modal] ?? "#f99006" },
        geometry: {
          type: "LineString",
          coordinates: r.points
            .slice()
            .sort((a, b) => a.sequence - b.sequence)
            .map((p) => [p.longitude, p.latitude]),
        },
      })),
    });
  }, [routes]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Mapa de Penedo"
      className="absolute inset-0 w-full h-full"
      style={{ background: MODAL_BG.bus, width: "100%", height: "100%" }}
    />
  );
}

export default MapView;
