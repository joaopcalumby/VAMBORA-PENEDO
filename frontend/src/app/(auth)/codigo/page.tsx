"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

export default function CodigoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api("/auth/recover/verify", {
        method: "POST",
        body: { email, code },
      });
      const qs = new URLSearchParams({ email, code });
      router.push(`/nova-senha?${qs.toString()}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Código inválido.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!email) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        E-mail ausente. <a href="/esqueci-senha" className="text-primary underline">Voltar</a>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Inserir código</h1>
        <p className="text-muted-foreground text-sm">
          Enviamos um código para <span className="font-medium">{email}</span>.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputMode="numeric"
            maxLength={8}
            autoComplete="one-time-code"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Validando..." : "Validar"}
        </Button>
      </form>
    </div>
  );
}
