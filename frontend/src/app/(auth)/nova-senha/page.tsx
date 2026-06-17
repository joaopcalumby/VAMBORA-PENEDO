"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

export default function NovaSenhaPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const code = params.get("code") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/auth/recover/reset", {
        method: "POST",
        body: { email, code, new_password: password },
      });
      router.replace("/login?reset=ok");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Não foi possível redefinir a senha.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!email || !code) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Dados ausentes. <a href="/esqueci-senha" className="text-primary underline">Voltar</a>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Nova senha</h1>
        <p className="text-muted-foreground text-sm">Defina uma senha de pelo menos 8 caracteres.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
