"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Clock3, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { getFavoriteRoutes, type StoredRouteCard } from "@/components/cards/route-storage";

function categoryBadgeClass(category: string) {
  if (category === "Intermunicipal") {
    return "bg-[#18261f] text-[#20fc8f]";
  }

  return "bg-[#20fc8f] text-[#0d1a15]";
}

function isDarkTransportCategory(category: string) {
  return category === "Intermunicipal" || category === "Balsa";
}

function FavoriteRouteItem({ route }: { route: StoredRouteCard }) {
  const useDarkStyle = isDarkTransportCategory(route.category);

  return (
    <Link
      href={route.href}
      className={`flex items-center gap-3 rounded-[1.1rem] border px-4 py-3.5 transition-transform active:scale-[0.99] sm:px-5 ${
        useDarkStyle ? "border-[#171b1a] bg-[#1a1d1c] text-white" : "border-[#d2d8d3] bg-white text-[#111815]"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold leading-none ${categoryBadgeClass(route.category)}`}>
            {route.category}
          </span>
        </div>
        <h3 className={`truncate text-sm font-medium ${useDarkStyle ? "text-white" : "text-[#111815]"}`}>
          {route.title}
        </h3>
        <div className={`mt-1 flex items-center gap-1.5 text-[11px] ${useDarkStyle ? "text-[#20fc8f]" : "text-[#6f7a74]"}`}>
          <Clock3 className="h-3 w-3" />
          <span>{route.schedule}</span>
        </div>
      </div>
    </Link>
  );
}

export default function FavoriteRoutesPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const userKey = session?.user?.email ?? null;
  const source = searchParams.get("from");
  const backHref = source === "dashboard" ? "/dashboard" : "/profile";

  const favoriteRoutes = useMemo(() => {
    if (status === "loading") {
      return [];
    }

    return getFavoriteRoutes(userKey);
  }, [status, userKey]);

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-6 px-6 pb-10 pt-10 sm:px-5 sm:pt-6 md:px-6 md:pt-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="flex items-center gap-2 rounded-2xl border border-[#d2d8d3] bg-white px-4 py-2.5 text-sm font-medium text-[#111815] transition-colors hover:bg-[#f4f6f4]"
        >
          <ChevronLeft size={18} />
          Voltar
        </Link>
      </div>

      <section className="space-y-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111815]">Rotas Favoritas</h1>
          <p className="mt-1 text-sm text-[#6f7a74]">Suas rotas salvas nesta conta aparecem aqui.</p>
        </div>

        {favoriteRoutes.length > 0 ? (
          <div className="space-y-3">
            {favoriteRoutes.map((route) => (
              <FavoriteRouteItem key={route.id} route={route} />
            ))}
          </div>
        ) : (
          <section className="rounded-[1.1rem] border border-[#d2d8d3] bg-white p-5 text-[#111815]">
            <div className="mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-[#20aa68]" />
              <h2 className="text-sm font-extrabold">Nenhuma rota favorita</h2>
            </div>
            <p className="text-sm text-[#6f7a74]">
              Favorite uma rota em “Rotas” para que ela apareça nesta página.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}