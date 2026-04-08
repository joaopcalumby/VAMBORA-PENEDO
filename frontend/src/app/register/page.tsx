import Image from "next/image";

function RegisterPage() {
    return (
        <main className="flex flex-col justify-center items-center min-h-screen bg-white px-4 py-2">
            <div className="mx-auto mb-5 flex w-full max-w-md items-center justify-center">
                <Image
                    src="/logovambora.svg"
                    alt="Logo"
                    width={160}
                    height={200}
                />
            </div>

            <p className="text-gray-500 text-center text-lg mb-8">
                <span className="text-black italic">Conectando</span> pessoas, <br /> movendo <span className="text-black italic">Penedo</span>.
            </p>
            <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white p-8 border-1 border-[#E5E5E5] shadow-xl">
                <header className="space-y-1 text-center">
                    <h1 className="text-xl font-medium text-zinc-900">Crie sua conta</h1>
                    <p className="text-[14px] text-zinc-500">
                        Preencha os campos abaixo para criar sua conta
                    </p>
                </header>

                <form className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="Nome" className="text-sm font-medium text-zinc-800">
                            Nome
                        </label>
                        <input
                            id="Nome"
                            type="text"
                            placeholder="Seu nome completo"
                            className="w-full bg-[#E7E7E7] rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="Cidade" className="text-sm font-medium text-zinc-800">
                            Cidade
                        </label>
                        <input
                            id="Cidade"
                            type="text"
                            placeholder="Sua cidade"
                            className="w-full bg-[#E7E7E7] rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="email" className="text-sm font-medium text-zinc-800">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="voce@exemplo.com"
                            className="w-full bg-[#E7E7E7] rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="password" className="text-sm font-medium text-zinc-800">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="********"
                            className="w-full bg-[#E7E7E7] rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-500"
                        />
                    </div>
                    <div className="flex flex-col justify-center items-center gap-5">
                        <button className="w-full rounded-lg bg-[#20FC8F] py-2 text-black transition hover:bg-[#304643] border-1 border-[#659C95]">
                            Criar conta
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default RegisterPage;