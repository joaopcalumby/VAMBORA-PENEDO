"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, Map as MapIcon, Bus, Ship, Star } from "lucide-react";
import Link from "next/link";
import {
  addRecentRoute,
  isRouteFavorite,
  toggleFavoriteRoute,
  type StoredRouteCard,
} from "@/components/cards/route-storage";

type RouteData = {
  id: number;
  name: string;
  coords: [number, number][];
  color: string;
};

type RouteCategory = "municipais" | "intermunicipais" | "balsas";

// Carregamento dinâmico do mapa (ESSENCIAL para Next.js)
const MapVisualizer = dynamic(() => import("@/components/map/MapVisualizer"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-[#0B0E14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#00FF94] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#00FF94] font-bold tracking-widest">CARREGANDO MAPA...</p>
      </div>
    </div>
  ),
});

const ROUTES_DATA: Record<RouteCategory, RouteData[]> = {
  municipais: [
    {
      id: 1,
      name: "Linha 01 - Centro",
      coords: [
        [-10.2908, -36.5859],
        [-10.2902, -36.5852],
        [-10.2897, -36.5845],
        [-10.2892, -36.5838],
        [-10.2888, -36.583],
        [-10.2886, -36.5822],
        [-10.2889, -36.5814],
        [-10.2895, -36.5809],
        [-10.2903, -36.5807],
        [-10.2912, -36.581],
        [-10.2919, -36.5816],
        [-10.2923, -36.5824],
        [-10.2924, -36.5833],
        [-10.2921, -36.5842],
        [-10.2915, -36.585],
        [-10.2908, -36.5859],
      ],
      color: "#00FF94",
    },
    { id: 2, name: "Linha 02 - Cohab", coords: [[-10.2909, -36.5858], [-10.2858, -36.5762]], color: "#00FF94" },
    { id: 3, name: "Linha 03 - Vila", coords: [[-10.2909, -36.5858], [-10.3012, -36.5938]], color: "#00FF94" },
  ],
  intermunicipais: [
    { id: 4, name: "Penedo - Igreja Nova", coords: [[-10.2909, -36.5858], [-10.125, -36.658]], color: "#3B82F6" },
    { id: 5, name: "Penedo - Arapiraca", coords: [[-10.2909, -36.5858], [-9.7549, -36.6619]], color: "#3B82F6" },
    { id: 6, name: "Penedo - Maceió", coords: [[-10.2909, -36.5858], [-9.6658, -35.7353]], color: "#3B82F6" },
  ],
  balsas: [
    { id: 7, name: "Penedo / Passagem (Balsa)", coords: [[-10.2929, -36.5863], [-10.3003, -36.5752]], color: "#E17070" },
  ],
};

export default function RotasPage() {
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [category, setCategory] = useState<RouteCategory>("municipais");
  const [isMinimized, setIsMinimized] = useState(false);
  const [favoriteRouteIds, setFavoriteRouteIds] = useState<number[]>([]);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  useEffect(() => {
    const allRouteIds = Object.values(ROUTES_DATA)
      .flatMap((group) => group)
      .map((route) => route.id)
      .filter((routeId) => isRouteFavorite(routeId));

    setFavoriteRouteIds(allRouteIds);
  }, []);

  const toStoredCard = (route: RouteData): StoredRouteCard => ({
    id: route.id,
    category: category === "intermunicipais" ? "Intermunicipal" : category === "balsas" ? "Balsa" : "Linha",
    title: route.name,
    schedule: "Visualizacao no mapa",
    href: "/rotas",
  });

  const handleSelectRoute = (route: RouteData) => {
    setSelectedRoute(route);
    setIsMinimized(true);
    addRecentRoute(toStoredCard(route));
  };

  const handleToggleFavorite = (route: RouteData) => {
    const nowFavorited = toggleFavoriteRoute(toStoredCard(route));

    setFavoriteRouteIds((current) => {
      if (nowFavorited) {
        return current.includes(route.id) ? current : [route.id, ...current];
      }

      return current.filter((routeId) => routeId !== route.id);
    });
  };

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#0B0E14]">
      <div className="absolute left-4 top-4 z-[9999] sm:left-6 sm:top-6">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#1F292E]/90 px-4 py-2.5 text-sm text-white shadow-2xl backdrop-blur-md transition-all active:scale-95 sm:px-5 sm:py-3"
        >
          <ChevronLeft size={18} className="sm:h-5 sm:w-5" />
          <span className="font-bold uppercase text-[10px] tracking-[0.2em] sm:text-xs">Voltar</span>
        </Link>
      </div>

      {/* Container do Mapa (Ocupa o fundo todo) */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <MapVisualizer selectedRoute={selectedRoute} token={MAPBOX_TOKEN} />
      </div>

      {/* Painel Inferior (Bottom Sheet) */}
      <div 
        className={`absolute bottom-0 z-[9999] w-full rounded-t-[28px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-15px_50px_rgba(0,0,0,0.6)] transition-all duration-500 ease-in-out sm:rounded-t-[40px]
        ${isMinimized ? "h-20 sm:h-24" : "h-[55svh] max-h-[78dvh] sm:h-[45%]"}`}
      >
        {/* Handle de Arrastar */}
        <div 
          className="flex cursor-pointer flex-col items-center py-3 sm:py-4"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="h-1.5 w-14 rounded-full bg-gray-200 sm:w-12" />
          {isMinimized && (
            <span className="mt-2 text-[10px] font-black uppercase tracking-tighter text-[#00FF94]">
              Ver todas as rotas
            </span>
          )}
        </div>

        {!isMinimized ? (
          <div className="flex h-full flex-col overflow-hidden px-4 sm:px-6">
            {/* Categorias (Tabs) */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 sm:mb-6 sm:overflow-visible">
              {(Object.keys(ROUTES_DATA) as RouteCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`min-w-[7rem] flex-1 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-tight transition-all sm:min-w-0 sm:py-3.5 ${
                    category === cat 
                    ? "bg-[#212B2F] text-[#00FF94] shadow-lg scale-105" 
                    : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Lista de Rotas */}
            <div className="flex-1 space-y-3 overflow-y-auto pb-36 pr-1 custom-scrollbar sm:pb-32">
              {ROUTES_DATA[category].map((route) => (
                <div
                  key={route.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectRoute(route)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectRoute(route);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-[22px] border-2 p-4 transition-all active:scale-[0.97] sm:rounded-[24px] sm:p-5 ${
                    selectedRoute?.id === route.id
                      ? "border-[#00FF94] bg-green-50/50"
                      : "border-gray-50 bg-gray-50/80"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className={`rounded-2xl p-3 shadow-sm ${selectedRoute?.id === route.id ? 'bg-[#212B2F] text-[#00FF94]' : 'bg-white text-gray-400'}`}>
                      {category === 'balsas' ? <Ship size={20} className="sm:h-[22px] sm:w-[22px]" /> : <Bus size={20} className="sm:h-[22px] sm:w-[22px]" />}
                    </div>
                    <span className="truncate text-sm font-extrabold text-slate-800 sm:text-base">{route.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleFavorite(route);
                      }}
                      className="rounded-full p-1.5 text-slate-500 transition-colors hover:text-[#15b56d]"
                      aria-label={favoriteRouteIds.includes(route.id) ? "Desfavoritar rota" : "Favoritar rota"}
                    >
                      <Star
                        size={18}
                        className={favoriteRouteIds.includes(route.id) ? "fill-[#20aa68] text-[#20aa68]" : "text-slate-400"}
                      />
                    </button>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: route.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Modo Minimizado */
          <div className="flex h-12 items-center justify-between px-5 sm:h-12 sm:px-8">
            <div className="min-w-0 pr-3">
              <p className="text-[10px] font-black uppercase leading-none tracking-tighter text-[#00FF94]">Rota Ativa</p>
              <h4 className="truncate text-base font-extrabold text-slate-900 sm:text-lg">
                {selectedRoute ? selectedRoute.name : "Selecione uma linha"}
              </h4>
            </div>
            <button 
              onClick={() => setIsMinimized(false)}
              className="rounded-2xl bg-[#212B2F] p-3 text-[#00FF94] shadow-xl transition-transform active:scale-90 sm:p-4"
            >
              <MapIcon size={20} className="sm:h-6 sm:w-6" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}