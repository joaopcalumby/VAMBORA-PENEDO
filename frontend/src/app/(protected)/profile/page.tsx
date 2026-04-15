import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Star, 
  MapPin, 
  Shield, 
  Settings, 
  HelpCircle
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userName = session.user?.name?.trim() ?? "";
  const firstAndSecondName = userName.split(/\s+/).slice(0, 2).join(" ").trim();
  const displayName = firstAndSecondName || session.user?.email || "Usuário";
  const initials = firstAndSecondName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "U";

  return (
    <main className="flex flex-col items-center w-full max-w-md mx-auto p-6 space-y-6 bg-transparent">
      
      {/* Avatar e Infos Principais */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-24 h-24 bg-[#00FF94] rounded-full flex items-center justify-center text-2xl font-bold  shadow-sm">
          <span className="font-medium">{initials}</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-medium text-slate-900">{displayName}</h2>
          <p className="text-gray-500 text-sm underline">{session.user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 w-full">
        <div className="bg-[#212B2F] p-4 rounded-xl flex flex-col items-center justify-center col-span-2">
          <span className="text-white font-medium text-lg">Penedo</span>
          <span className="text-[#00FF94] text-[12px] uppercase">Cidade</span>
        </div>
 
        <div className="bg-[#212B2F] p-4 rounded-xl flex flex-col items-center justify-center">
          <span className="text-white font-bold text-lg">47</span>
          <span className="text-[#00FF94] text-[12px] uppercase text-center leading-tight">Viagens</span>
        </div>

        <div className="bg-[#212B2F] p-4 rounded-xl flex flex-col items-center justify-center">
          <span className="text-white font-bold text-lg">2</span>
          <span className="text-[#00FF94] text-[12px] uppercase text-center leading-tight">Rotas Fav</span>
        </div>
      </div>


      <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-400">
        <MenuOption icon={<Star size={20} />} label="Rotas Favoritas" href="/rotas/favoritas?from=profile" />
        <MenuOption icon={<MapPin size={20} />} label="Histórico de Viagens" />
        <MenuOption icon={<Shield size={20} />} label="Privacidade" />
        <MenuOption icon={<Settings size={20} />} label="Configurações" />
        <MenuOption icon={<HelpCircle size={20} />} label="Ajuda e Suporte" last />
      </div>

      {/* Botão Sair da Conta */}
      <LogoutButton />

    </main>
  );
}

// Subcomponente para as linhas do menu
function MenuOption({ icon, label, href, last = false }: { icon: React.ReactNode, label: string, href?: string, last?: boolean }) {
  const content = (
    <>
      <span className="text-[#00FF94]">{icon}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </>
  );

  const baseClassName = `flex items-center gap-4 p-4 hover:bg-gray-100 cursor-pointer transition-colors ${!last ? 'border-b border-gray-400' : ''}`;

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div className={baseClassName}>
      {content}
    </div>
  );
}