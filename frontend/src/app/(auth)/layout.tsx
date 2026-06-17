// Route group sem TabBar — telas de autenticação (login, cadastro,
// recuperação) ficam em fluxo linear sem navegação inferior.
// As páginas em si entram em checkpoints posteriores.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
