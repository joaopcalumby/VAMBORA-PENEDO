"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineCard } from "@/components/linhas/LineCard";
import { useApi } from "@/lib/hooks/useApi";
import type { LineSummary } from "@/lib/types";

export default function BuscaPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";

  const callApi = useApi();
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<LineSummary[] | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }
    const path = `/linhas?q=${encodeURIComponent(term)}`;
    let cancelled = false;
    callApi<LineSummary[]>(path)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [callApi, query]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = query.trim();
    if (term) {
      router.replace(`/busca?q=${encodeURIComponent(term)}`);
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link href="/inicio">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar linha, número ou destino"
            className="pl-10"
            aria-label="Buscar linha"
          />
        </form>
      </div>

      {results === null && query.trim() && (
        <p className="text-sm text-muted-foreground">Buscando...</p>
      )}
      {results && query.trim() && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma linha encontrada para “{query}”.
        </p>
      )}
      <ul className="space-y-2">
        {results?.map((line) => (
          <li key={line.id}>
            <LineCard line={line} />
          </li>
        ))}
      </ul>
    </div>
  );
}
