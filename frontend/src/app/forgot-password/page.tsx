"use client";

import Link from "next/link";
import { ChevronLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <main className="app-page flex min-h-screen items-center justify-center px-4 py-8">
      <section className="app-card w-full max-w-md space-y-5 p-8">
        <Link
          href="/login"
          className="app-text-foreground app-hover-accent-strong inline-flex items-center gap-2 text-sm font-medium transition"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para login
        </Link>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#20aa68]" />
            <h1 className="app-text-foreground text-xl font-semibold">Recuperar senha</h1>
          </div>
          <p className="app-text-muted text-sm">
            Esta funcionalidade ainda esta em desenvolvimento. Entre em contato com a equipe para recuperar sua conta.
          </p>
        </div>
      </section>
    </main>
  );
}
