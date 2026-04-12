"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type SignupForm = {
    name: string;
    city: string;
    email: string;
    password: string;
    confirmPassword: string;
};

function SignupPage() {
    const [form, setForm] = useState<SignupForm>({
        name: "",
        city: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleChange = (field: keyof SignupForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (form.password.length < 6) {
            setErrorMessage("A senha deve ter no minimo 6 caracteres.");
            return;
        }

        if (form.password.length > 25) {
            setErrorMessage("A senha deve ter no maximo 25 caracteres.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setErrorMessage("As senhas nao coincidem.");
            return;
        }

        setIsLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;

            if (!apiUrl) {
                setErrorMessage("URL da API nao configurada no ambiente.");
                return;
            }

            const cleanApiUrl = apiUrl.replace(/\/$/, "");
            const response = await fetch(`${cleanApiUrl}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    city: form.city,
                    email: form.email,
                    password: form.password,
                }),
            });

            if (!response.ok) {
                setErrorMessage("Nao foi possivel concluir o cadastro.");
                return;
            }

            setSuccessMessage("Conta criada com sucesso. Agora faca login.");
            setForm({
                name: "",
                city: "",
                email: "",
                password: "",
                confirmPassword: "",
            });
        } catch {
            setErrorMessage("Erro ao conectar com o servidor. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="app-page flex min-h-screen flex-col items-center justify-center px-4 py-2">
            <div className="mx-auto mb-5 flex w-full max-w-md items-center justify-center">
                <Image
                    src="/logovambora-dark.svg"
                    alt="Logo"
                    width={160}
                    height={200}
                />
            </div>

            <p className="app-text-muted mb-8 text-center text-lg">
                <span className="app-text-foreground italic">Conectando</span> pessoas, <br /> movendo <span className="app-text-foreground italic">Penedo</span>.
            </p>
            <section className="app-card mx-auto flex w-full max-w-md flex-col gap-6 p-8">
                <header className="space-y-1 text-center">
                    <h1 className="app-text-foreground text-xl font-medium">Crie sua conta</h1>
                    <p className="app-text-muted text-sm">
                        Preencha os campos abaixo para criar sua conta
                    </p>
                </header>

                <form className="space-y-4" onSubmit={handleSignup} method="POST">
                    {errorMessage && (
                        <div className="rounded border border-red-400 bg-red-100 px-4 py-2 text-sm text-red-700 transition-all">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="rounded border border-green-400 bg-green-100 px-4 py-2 text-sm text-green-700 transition-all">
                            {successMessage}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label htmlFor="name" className="app-text-foreground text-sm font-medium">
                            Nome
                        </label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            placeholder="Seu nome completo"
                            className="app-input"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="city" className="app-text-foreground text-sm font-medium">
                            Cidade
                        </label>
                        <input
                            id="city"
                            type="text"
                            name="city"
                            placeholder="Sua cidade"
                            className="app-input"
                            value={form.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            required
                        />
                    </div>

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
                            value={form.email}
                            onChange={(e) => handleChange("email", e.target.value)}
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
                            maxLength={25}
                            value={form.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="confirmPassword" className="app-text-foreground text-sm font-medium">
                            Confirmar senha
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            placeholder="********"
                            className="app-input"
                            value={form.confirmPassword}
                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col justify-center items-center gap-5">
                        <button type="submit" disabled={isLoading} className="app-button-primary flex w-full items-center justify-center gap-2 py-2">
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
                        </button>

                        <Link href="/login" className="app-link-accent text-sm font-medium">
                            Ja tenho conta
                        </Link>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default SignupPage;