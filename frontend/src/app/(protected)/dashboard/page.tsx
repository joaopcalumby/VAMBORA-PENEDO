import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SearchBar from "@/components/search/SearchBar";
import RouteCards from "@/components/cards/RouteCards";

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
    <main className="flex h-screen flex-col items-center justify-left gap-7 p-10 py-15">
      <section className="flex flex-col gap-5">
        <header className="flex">
          <div className="app-bg-accent mr-4 flex h-13 w-13 items-center justify-center rounded-full text-white">
            <span className="font-bold text-black">{initials}</span>
          </div>
          <div>
            <p>Bem-vindo,</p>
            <span>{displayName}</span>
          </div>
        </header>
        <SearchBar />
        <RouteCards />
      </section>
    </main>
  );
}