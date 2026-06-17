"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApi } from "@/lib/hooks/useApi";
import { ApiError } from "@/lib/api";
import { api } from "@/lib/api";
import { useSession } from "next-auth/react";
import type {
  CategoryRequestResponse,
  CategoryResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

export default function CategoriaPage() {
  const callApi = useApi();
  const { data: session } = useSession();

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [request, setRequest] = useState<CategoryRequestResponse | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    callApi<CategoryResponse[]>("/categorias").then(setCategories).catch(() => setCategories([]));
    callApi<CategoryRequestResponse | null>("/categorias/minha-solicitacao")
      .then(setRequest)
      .catch(() => setRequest(null));
  }, [callApi]);

  const selectedCategory = categories.find((c) => c.slug === selected);

  async function submit() {
    if (!selectedCategory) return;
    setError(null);

    const file = fileInputRef.current?.files?.[0] ?? null;

    if (selectedCategory.requires_document) {
      if (!file) {
        setError("Anexe o documento comprobatório.");
        return;
      }
      if (!ALLOWED.includes(file.type)) {
        setError("Tipo de arquivo não permitido. Aceitos: JPG, PNG, PDF.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Arquivo excede o limite de 5 MB.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("category_slug", selectedCategory.slug);
    if (file) formData.append("document", file);

    setSubmitting(true);
    try {
      // multipart usa o api() direto (não o useApi) só pra simplificar
      // o tipo de body — o token vem da sessão manualmente.
      const created = await api<CategoryRequestResponse>("/categorias/solicitar", {
        method: "POST",
        body: formData,
        token: session?.backendToken ?? null,
      });
      setRequest(created);
      setSelected("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao solicitar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link href="/perfil">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Categoria tarifária</h1>
      </div>

      {request && (
        <section className={cn(
          "rounded-lg border p-4",
          request.status === "approved" && "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800",
          request.status === "pending" && "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800",
          request.status === "rejected" && "bg-destructive/10 border-destructive/30",
        )}>
          <p className="text-xs uppercase tracking-wide">Status atual</p>
          <p className="font-semibold">
            {request.category_name}
            {" "}
            <span className="text-sm font-normal">
              ({statusLabel(request.status)})
            </span>
          </p>
          {request.status === "rejected" && request.justification && (
            <p className="text-xs mt-2">Motivo: {request.justification}</p>
          )}
          {request.status === "pending" && (
            <p className="text-xs mt-2 text-muted-foreground">
              Enquanto pendente, a tarifa cobrada é a Padrão.
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">Solicitar categoria</h2>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.slug}>
              <button
                type="button"
                onClick={() => setSelected(cat.slug)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors min-h-[44px]",
                  selected === cat.slug
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-accent/40"
                )}
              >
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.requires_document
                    ? "Exige documento comprobatório"
                    : "Sem documento"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedCategory?.requires_document && (
        <section className="space-y-2 rounded-lg border border-border bg-card p-4">
          <Label htmlFor="document">Documento (JPG, PNG ou PDF, até 5 MB)</Label>
          <input
            id="document"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground file:cursor-pointer"
          />
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!selectedCategory || submitting}
        onClick={submit}
      >
        <Upload className="h-4 w-4 mr-2" />
        {submitting ? "Enviando..." : "Enviar solicitação"}
      </Button>
    </div>
  );
}

function statusLabel(s: CategoryRequestResponse["status"]) {
  switch (s) {
    case "approved": return "aprovada";
    case "pending": return "em análise";
    case "rejected": return "rejeitada";
  }
}
