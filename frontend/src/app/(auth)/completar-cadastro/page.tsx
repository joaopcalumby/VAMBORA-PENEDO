"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

// Tela exibida ao usuário Google após signIn quando needs_completion=true.
// Nome e e-mail vêm da sessão (travados); o resto é preenchido aqui.
export default function CompletarCadastroPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") {
    return <p className="text-center text-muted-foreground">Carregando...</p>;
  }
  if (!session?.backendToken) {
    return (
      <p className="text-center text-muted-foreground">
        Sessão não encontrada. <a href="/login" className="text-primary underline">Entrar</a>
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api("/auth/complete-profile", {
        method: "POST",
        token: session?.backendToken || "",
        body: { cpf, birth_date: birthDate, phone, accept_terms: accept },
      });
      // Atualiza a sessão pra refletir o needsCompletion=false.
      await update();
      router.replace("/inicio");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Não foi possível concluir.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Completar cadastro</h1>
        <p className="text-muted-foreground text-sm">Só faltam alguns dados.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={session.user?.name ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" value={session.user?.email ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} required inputMode="numeric" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data de nascimento</Label>
          <Input id="birth_date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            required
            className="mt-1 h-4 w-4"
          />
          <span>
            Li e aceito os <a href="#" className="text-primary underline">Termos de Uso</a> e a{" "}
            <a href="#" className="text-primary underline">Política de Privacidade</a>.
          </span>
        </label>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Salvando..." : "Concluir"}
        </Button>
      </form>
    </div>
  );
}
