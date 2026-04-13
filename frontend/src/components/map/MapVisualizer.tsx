"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Compass, RotateCcw } from "lucide-react";

type RoutePoint = [number, number];

type SelectedRoute = {
  id: number;
  name: string;
  coords: RoutePoint[];
  color: string;
};

type DirectionGeometry = {
  coordinates?: [number, number][];
};

type DirectionRoute = {
  geometry?: DirectionGeometry;
};

type DirectionsResponse = {
  routes?: DirectionRoute[];
};

interface MapVisualizerProps {
  selectedRoute: SelectedRoute | null;
  token: string;
}

export default function MapVisualizer({ selectedRoute, token }: MapVisualizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const penedoCenter = useMemo<[number, number]>(() => [-36.5858, -10.2909], []);
  const mapboxStyle = "mapbox://styles/mapbox/satellite-streets-v12";

  const updateRouteSource = (
    map: mapboxgl.Map,
    coordinates: [number, number][],
    color: string,
  ) => {
    const routeSourceData = {
      type: "FeatureCollection",
      features: coordinates.length
        ? [
            {
              type: "Feature",
              properties: {
                color,
              },
              geometry: {
                type: "LineString",
                coordinates,
              },
            },
          ]
        : [],
    } as const;

    const source = map.getSource("selected-route") as mapboxgl.GeoJSONSource | undefined;

    if (source) {
      source.setData(routeSourceData as never);
      return;
    }

    map.addSource("selected-route", {
      type: "geojson",
      data: routeSourceData as never,
    });

    map.addLayer({
      id: "route-glow",
      type: "line",
      source: "selected-route",
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#00FF94"],
        "line-width": 12,
        "line-opacity": 0.25,
        "line-blur": 2,
      },
    });

    map.addLayer({
      id: "route-line",
      type: "line",
      source: "selected-route",
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#00FF94"],
        "line-width": 5,
        "line-opacity": 1,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    });
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !token) {
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapboxStyle,
      center: penedoCenter,
      zoom: 14.2,
      pitch: 60,
      bearing: -18,
      antialias: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      setIsReady(true);

      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
      }

      if (!map.getLayer("3d-buildings")) {
        const layers = map.getStyle().layers ?? [];
        const labelLayerId = layers.find(
          (layer) => layer.type === "symbol" && layer.layout && "text-field" in layer.layout,
        )?.id;

        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": "#7b8b94",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14,
                0,
                14.05,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14,
                0,
                14.05,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.8,
            },
          },
          labelLayerId,
        );
      }

      if (!map.getLayer("sky")) {
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0, 0],
            "sky-atmosphere-sun-intensity": 10,
          },
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, [penedoCenter, token]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isReady) {
      return;
    }

    map.setPitch(is3D ? 60 : 0);
    map.setBearing(is3D ? -18 : 0);
    map.setTerrain(is3D
      ? {
          source: "mapbox-dem",
          exaggeration: 1.35,
        }
      : null,
    );

    if (map.getLayer("sky")) {
      map.setLayoutProperty("sky", "visibility", is3D ? "visible" : "none");
    }
  }, [is3D, isReady]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isReady) {
      return;
    }

    if (!selectedRoute) {
      updateRouteSource(map, [], "#00FF94");
      return;
    }

    const fallbackCoordinates = selectedRoute.coords.map(([lat, lng]) => [lng, lat] as [number, number]);
    const directionsCoordinates = fallbackCoordinates
      .map(([lng, lat]) => `${lng},${lat}`)
      .join(";");

    let cancelled = false;

    const loadRoadSnappedRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${directionsCoordinates}?geometries=geojson&overview=full&continue_straight=true&access_token=${token}`,
        );

        if (!response.ok) {
          throw new Error("Directions API failed");
        }

        const data = (await response.json()) as DirectionsResponse;
        const snappedCoordinates = data.routes?.[0]?.geometry?.coordinates;
        const routeCoordinates = snappedCoordinates?.length ? snappedCoordinates : fallbackCoordinates;

        if (cancelled) {
          return;
        }

        updateRouteSource(map, routeCoordinates, selectedRoute.color);

        const bounds = routeCoordinates.reduce(
          (acc, coordinate) => acc.extend(coordinate),
          new mapboxgl.LngLatBounds(routeCoordinates[0], routeCoordinates[0]),
        );

        map.fitBounds(bounds, {
          padding: { top: 90, bottom: 240, left: 40, right: 40 },
          duration: 1200,
          pitch: is3D ? 60 : 0,
          bearing: is3D ? -18 : 0,
          maxZoom: 16,
        });
      } catch {
        if (cancelled) {
          return;
        }

        updateRouteSource(map, fallbackCoordinates, selectedRoute.color);
      }
    };

    loadRoadSnappedRoute();

    return () => {
      cancelled = true;
    };
  }, [is3D, isReady, selectedRoute, token]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0E14]">
      <div ref={containerRef} className="h-full w-full" />

      {!token && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0B0E14]/90 px-6 text-center">
          <div className="max-w-sm space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur-xl">
            <p className="text-lg font-semibold">Token do Mapbox ausente</p>
            <p className="text-sm text-white/70">
              Defina <span className="font-medium">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</span> no arquivo
              <span className="font-medium"> .env.local</span> para carregar o mapa 3D.
            </p>
          </div>
        </div>
      )}

      {token && (
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 sm:right-4 sm:top-4 sm:flex-row">
          <button
            type="button"
            onClick={() => setIs3D((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#11181D]/85 px-3 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl transition active:scale-95 sm:px-4 sm:py-3 sm:text-sm hover:bg-[#1A2329]"
          >
            <Compass size={15} className="sm:h-4 sm:w-4" />
            {is3D ? "Modo 3D" : "Modo 2D"}
          </button>

          <button
            type="button"
            onClick={() => {
              const map = mapRef.current;

              if (!map) {
                return;
              }

              map.flyTo({
                center: penedoCenter,
                zoom: 14.2,
                pitch: is3D ? 60 : 0,
                bearing: is3D ? -18 : 0,
                duration: 1200,
              });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#11181D]/85 px-3 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl transition active:scale-95 sm:px-4 sm:py-3 sm:text-sm hover:bg-[#1A2329]"
          >
            <RotateCcw size={15} className="sm:h-4 sm:w-4" />
            Centralizar
          </button>
        </div>
      )}
    </div>
  );
}