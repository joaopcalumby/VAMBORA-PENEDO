"use client";

import Link from "next/link";
import Image from "next/image";
import { MoveRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorMessage("E-mail ou senha incorretos.");
      }
    } catch {
      setErrorMessage("Erro ao conectar com o servidor. Verifique sua conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="route-enter app-page flex min-h-screen flex-col items-center justify-center px-4 py-2">
      <div className="mx-auto mb-5 flex w-full max-w-md items-center justify-center">
        <Image
          src="/logovambora-dark.svg"
          alt="Logo"
          width={160}
          height={200}
          priority
        />
      </div>

      <p className="app-text-muted mb-8 text-center text-lg">
        <span className="app-text-foreground italic">Conectando</span> pessoas, <br />
        movendo <span className="app-text-foreground italic">Penedo</span>.
      </p>

      <section className="app-card mx-auto flex w-full max-w-md flex-col gap-6 p-8">
        <header className="space-y-1 text-center">
          <h1 className="app-text-foreground text-xl font-medium">Faça login na sua conta</h1>
          <p className="app-text-muted text-sm">
            Caso não tenha uma conta clique em criar conta
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleLogin} method="POST">
          {errorMessage && (
            <div className="rounded border border-red-400 bg-red-100 px-4 py-2 text-sm text-red-700 transition-all">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="app-text-foreground text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="voce@exemplo.com"
              className="app-input"
              value={credentials.email}
              onChange={(event) => setCredentials({ ...credentials, email: event.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="app-text-foreground text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="********"
              className="app-input"
              value={credentials.password}
              onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="app-link-accent text-sm font-medium">
              Esqueceu a senha?
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center gap-5">
            <button
              type="submit"
              disabled={isLoading}
              className="app-button-primary flex w-full items-center justify-center gap-2 py-2"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </button>

            <Link
              className="app-text-foreground app-hover-accent-strong flex items-center justify-center gap-2 transition"
              href="/signup"
            >
              Criar conta <MoveRight />
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}