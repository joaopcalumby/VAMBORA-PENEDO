"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Clock3, Star } from "lucide-react";
import Link from "next/link";
import {
  getFavoriteRoutes,
  getRecentRoutes,
  type StoredRouteCard,
} from "@/components/cards/route-storage";

function categoryBadgeClass(category: string) {
  if (category === "Intermunicipal") {
    return "bg-[#18261f] text-[#20fc8f]";
  }

  return "bg-[#20fc8f] text-[#0d1a15]";
}

function RouteListItem({ route, isDark }: { route: StoredRouteCard; isDark?: boolean }) {
  return (
    <Link
      href={route.href}
      className={`flex items-center gap-3 rounded-[1.1rem] border px-4 py-3.5 transition-transform active:scale-[0.99] sm:px-5 ${
        isDark ? "border-[#171b1a] bg-[#1a1d1c] text-white" : "border-[#d2d8d3] bg-white text-[#111815]"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold leading-none ${categoryBadgeClass(route.category)}`}>
            {route.category}
          </span>
        </div>
        <h3 className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-[#111815]"}`}>
          {route.title}
        </h3>
        <div className={`mt-1 flex items-center gap-1.5 text-[11px] ${isDark ? "text-[#20fc8f]" : "text-[#6f7a74]"}`}>
          <Clock3 className="h-3 w-3" />
          <span>{route.schedule}</span>
        </div>
      </div>

      <ChevronRight className={`h-5 w-5 shrink-0 ${isDark ? "text-[#20fc8f]" : "text-[#20fc8f]"}`} />
    </Link>
  );
}

export default function RouteCards() {
  const [favoriteRoutes, setFavoriteRoutes] = useState<StoredRouteCard[]>([]);
  const [recentRoutes, setRecentRoutes] = useState<StoredRouteCard[]>([]);

  useEffect(() => {
    setFavoriteRoutes(getFavoriteRoutes());
    setRecentRoutes(getRecentRoutes());
  }, []);

  const hasFavorites = favoriteRoutes.length > 0;
  const hasRecents = recentRoutes.length > 0;

  return (
    <main className="flex w-full flex-col gap-8">
      {hasFavorites && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#111815]">Rotas Favoritas</h2>
            <Link href="/rotas" className="text-sm font-medium text-[#20aa68] transition-colors hover:text-[#129254]">
              Ver todas
            </Link>
          </div>

          <div className="-mx-1 overflow-x-auto px-1 pb-2 dashboard-horizontal-scroll">
            <div className="flex gap-3 pr-2">
              {favoriteRoutes.map((route, index) => (
                <Link
                  key={route.id}
                  href={route.href}
                  className={`min-w-[9.75rem] rounded-[1.1rem] border px-3 py-3 shadow-sm transition-transform active:scale-[0.99] sm:min-w-[11.5rem] ${
                    index === 1 ? "border-[#1b1f1d] bg-[#1a1d1c] text-white" : "border-[#d2d8d3] bg-white text-[#111815]"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold leading-none ${categoryBadgeClass(route.category)}`}>
                      {route.category}
                    </span>
                  </div>
                  <h3 className={`line-clamp-1 text-[12px] font-medium ${index === 1 ? "text-white" : "text-[#111815]"}`}>
                    {route.title}
                  </h3>
                  <p className={`mt-1 text-[11px] ${index === 1 ? "text-[#20fc8f]" : "text-[#6f7a74]"}`}>
                    {route.schedule}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasRecents && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#111815]">Rotas Recentes</h2>
            <Link href="/rotas" className="text-sm font-medium text-[#20aa68] transition-colors hover:text-[#129254]">
              Ver todas
            </Link>
          </div>

          <div className="space-y-3">
            {recentRoutes.map((route, index) => (
              <RouteListItem key={route.id} route={route} isDark={index === recentRoutes.length - 1} />
            ))}
          </div>
        </section>
      )}

      {!hasFavorites && !hasRecents && (
        <section className="rounded-[1.1rem] border border-[#d2d8d3] bg-white p-5 text-[#111815] shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-[#20aa68]" />
            <h2 className="text-sm font-extrabold">Sem favoritos e recentes ainda</h2>
          </div>
          <p className="text-sm text-[#6f7a74]">
            Favorite uma rota para ela aparecer aqui e use uma linha no mapa para criar sua lista de recentes.
          </p>
        </section>
      )}

      <Link href="/rotas" className="sr-only">
        Ver rotas
      </Link>
    </main>
  );
}