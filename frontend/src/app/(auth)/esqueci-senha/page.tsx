"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

export default function EsqueciSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api("/auth/recover", {
        method: "POST",
        body: { email, channel },
      });
      const qs = new URLSearchParams({ email });
      router.push(`/codigo?${qs.toString()}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Não foi possível solicitar o código.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Esqueci minha senha</h1>
        <p className="text-muted-foreground text-sm">Como deseja receber o código?</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail cadastrado</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Canal</legend>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="channel"
              value="email"
              checked={channel === "email"}
              onChange={() => setChannel("email")}
            />
            <span>Enviar para meu e-mail</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="channel"
              value="sms"
              checked={channel === "sms"}
              onChange={() => setChannel("sms")}
            />
            <span>Enviar para meu telefone (SMS)</span>
          </label>
          {channel === "sms" && (
            <p className="text-xs text-muted-foreground">
              Envio por SMS está simulado nesta versão.
            </p>
          )}
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar código"}
        </Button>
      </form>

      <p className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
