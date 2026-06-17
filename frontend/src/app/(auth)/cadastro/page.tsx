"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

type RegisterPayload = {
  name: string;
  email: string;
  cpf: string;
  birth_date: string;
  phone: string;
  password: string;
  accept_terms: boolean;
};

export default function CadastroPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterPayload & { confirm: string }>({
    name: "",
    email: "",
    cpf: "",
    birth_date: "",
    phone: "",
    password: "",
    confirm: "",
    accept_terms: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setSubmitting(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: {
          name: form.name,
          email: form.email,
          cpf: form.cpf,
          birth_date: form.birth_date,
          phone: form.phone,
          password: form.password,
          accept_terms: form.accept_terms,
        } satisfies RegisterPayload,
      });
      // Já que o backend criou o usuário, fazemos signIn pra obter sessão.
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.error) {
        setError("Cadastro criado, mas o login falhou. Tente entrar manualmente.");
        return;
      }
      router.replace("/inicio");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Não foi possível concluir o cadastro.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Criar conta</h1>
        <p className="text-muted-foreground text-sm">É rápido. Você precisa de:</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field id="name" label="Nome completo" value={form.name} onChange={(v) => set("name", v)} autoComplete="name" required />
        <Field id="email" label="E-mail" type="email" value={form.email} onChange={(v) => set("email", v)} autoComplete="email" required />
        <Field id="cpf" label="CPF" value={form.cpf} onChange={(v) => set("cpf", v)} required inputMode="numeric" />
        <Field id="birth_date" label="Data de nascimento" type="date" value={form.birth_date} onChange={(v) => set("birth_date", v)} required />
        <Field id="phone" label="Telefone" type="tel" value={form.phone} onChange={(v) => set("phone", v)} autoComplete="tel" required />
        <Field id="password" label="Senha" type="password" value={form.password} onChange={(v) => set("password", v)} autoComplete="new-password" required minLength={8} />
        <Field id="confirm" label="Confirmar senha" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} autoComplete="new-password" required minLength={8} />

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.accept_terms}
            onChange={(e) => set("accept_terms", e.target.checked)}
            required
            className="mt-1 h-4 w-4"
          />
          <span>
            Li e aceito os <a href="#" className="text-primary underline">Termos de Uso</a> e a{" "}
            <a href="#" className="text-primary underline">Política de Privacidade</a> (LGPD).
          </span>
        </label>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Criando..." : "Criar conta"}
        </Button>
      </form>

      <p className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          Já tenho conta
        </Link>
      </p>
    </div>
  );
}

function Field(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  minLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        minLength={props.minLength}
      />
    </div>
  );
}
