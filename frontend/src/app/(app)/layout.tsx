import { TabBar } from "@/components/navigation/TabBar";

// Route group autenticado — telas de uso comum compartilham a TabBar
// inferior fixa (Início, Mapa, Carteira, Perfil).
//
// O pb-16 reserva espaço para a TabBar (h-16 aprox) sem sobrepor o
// conteúdo final das telas.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col pb-16">
      <main className="flex-1">{children}</main>
      <TabBar />
    </div>
  );
}