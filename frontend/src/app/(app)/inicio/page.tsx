"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LineCard } from "@/components/linhas/LineCard";
import { useApi } from "@/lib/hooks/useApi";
import type { FavoriteResponse, LineSummary } from "@/lib/types";

export default function InicioPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const callApi = useApi();

  const [lines, setLines] = useState<LineSummary[] | null>(null);
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    callApi<LineSummary[]>("/linhas").then(setLines).catch(() => setLines([]));
  }, [callApi]);

  useEffect(() => {
    if (status !== "authenticated") return;
    callApi<FavoriteResponse[]>("/favoritos")
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, [callApi, status]);

  const favoriteLines = favorites.filter((f) => f.target_type === "line");
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/busca?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          Oi{firstName ? `, ${firstName}` : ""}
        </h1>
      </header>

      <form onSubmit={submitSearch} className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          aria-label="Buscar linha"
          placeholder="Buscar linha, número ou destino"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <FavoritesBlock favorites={favoriteLines} lines={lines ?? []} />

      <section className="space-y-3">
        <h2 className="font-semibold">Todas as linhas</h2>
        {lines === null && (
          <ul className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-16 w-full" />
              </li>
            ))}
          </ul>
        )}
        {lines && lines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma linha cadastrada.
          </p>
        )}
        <ul className="space-y-2">
          {lines?.map((line) => (
            <li key={line.id}>
              <LineCard line={line} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FavoritesBlock({
  favorites,
  lines,
}: {
  favorites: FavoriteResponse[];
  lines: LineSummary[];
}) {
  if (favorites.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        <Star className="mx-auto h-6 w-6 mb-2" aria-hidden />
        Salve linhas e pontos para acesso rápido.
      </section>
    );
  }

  const byId = new Map(lines.map((l) => [l.id, l]));
  const preview = favorites.slice(0, 4);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Seus favoritos</h2>
        <Button asChild variant="link" size="sm">
          <Link href="/favoritos">Ver todos</Link>
        </Button>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {preview.map((fav) => {
          const line = byId.get(fav.target_id);
          if (!line) return null;
          return (
            <li key={fav.id}>
              <Link
                href={`/linha/${line.id}`}
                className="block rounded-lg border border-border bg-card p-3 hover:bg-accent/40 min-h-[44px]"
              >
                <p className="text-xs text-muted-foreground">{line.number}</p>
                <p className="text-sm font-medium" title={line.name}>
                  {line.name}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
