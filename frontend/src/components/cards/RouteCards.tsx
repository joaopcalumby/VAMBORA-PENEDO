import { ChevronRight, Clock3, Star } from "lucide-react";
import Link from "next/link";

type RouteCard = {
  id: number;
  category: string;
  title: string;
  schedule: string;
  href: string;
  favorite?: boolean;
};

const favoriteRoutes: RouteCard[] = [
  {
    id: 1,
    category: "Linha 1",
    title: "Centro → Dom constantino → Bom...",
    schedule: "A cada 30 min",
    href: "/rotas",
  },
  {
    id: 2,
    category: "Intermunicipal",
    title: "Penedo → Igreja Nova - Alagoas",
    schedule: "A cada 50 min",
    href: "/rotas",
  },
];

const recentRoutes: RouteCard[] = [
  {
    id: 3,
    category: "Linha 1",
    title: "Santa Luzia → Centro → Porto",
    schedule: "05:30 - 22:00",
    href: "/rotas",
  },
  {
    id: 4,
    category: "Linha 2",
    title: "Centro → Jardim → Santa Luzia",
    schedule: "06:00 - 23:00",
    href: "/rotas",
  },
  {
    id: 5,
    category: "Linha 3",
    title: "Centro → Bairro Novo → Vila Verde",
    schedule: "05:30 - 22:30",
    href: "/rotas",
  },
  {
    id: 6,
    category: "Intermunicipal",
    title: "Penedo → Igreja Nova - AL",
    schedule: "07:00 - 20:00",
    href: "/rotas",
  },
];

function categoryBadgeClass(category: string) {
  if (category === "Intermunicipal") {
    return "bg-[#18261f] text-[#20fc8f]";
  }

  return "bg-[#20fc8f] text-[#0d1a15]";
}

function RouteListItem({ route, isDark }: { route: RouteCard; isDark?: boolean }) {
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
  return (
    <main className="flex w-full flex-col gap-8">
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
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
                className={`min-w-[10.75rem] rounded-[1.1rem] border px-3 py-3 shadow-sm transition-transform active:scale-[0.99] sm:min-w-[11.5rem] ${
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

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
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

      <Link href="/rotas" className="sr-only">
        Ver rotas
      </Link>
    </main>
  );
}