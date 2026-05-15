import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SearchBar from "@/components/search/SearchBar";
import RouteCards from "@/components/cards/RouteCards";
import MobileHeroCarousel from "@/components/carousel/MobileHeroCarousel";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userName = session.user?.name?.trim() ?? "";
  const firstAndSecondName = userName.split(/\s+/).slice(0, 2).join(" ").trim();
  const displayName = firstAndSecondName || session.user?.email || "Usuario";
  const nameInitials = firstAndSecondName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  const initials = nameInitials || displayName.slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-6 px-3 pb-5 pt-4 sm:gap-7 sm:px-5 sm:pb-6 sm:pt-6 md:px-6 md:pt-8">
      <section className="flex w-full flex-col gap-5 p-6">
        <header className="flex items-center">
          <div className="app-bg-accent mr-3 flex h-12 w-12 items-center justify-center rounded-full text-white sm:mr-4 sm:h-13 sm:w-13">
            <span className="font-bold text-black">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-[#6f7a74]">Bem-vindo,</p>
            <span className="block truncate text-base font-semibold text-[#111815]">{displayName}</span>
          </div>
        </header>
        <SearchBar />
        <RouteCards />
        <MobileHeroCarousel />
      </section>
    </main>
  );
}