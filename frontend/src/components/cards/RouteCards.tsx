import { BusFront, Star } from "lucide-react";
import Link from "next/link";

export default function RouteCards() {
  return (
    <main>
      <section className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Link href="/linhas" className="flex flex-col">
            <div className="flex h-20 w-30 flex-col items-center rounded-lg border border-zinc-400 bg-[var(--surface)] p-4">
              <BusFront width={56} height={56} color="#20FC8F" />
              <p>Linhas</p>
            </div>
          </Link>

          <Link href="/intermunicipal" className="flex flex-col">
            <div className="flex h-20 w-30 flex-col items-center rounded-lg border border-zinc-400 bg-[var(--accent-foreground)] p-4">
              <BusFront width={56} height={56} color="#20FC8F" />
              <p className="text-white">Intermunicipal</p>
            </div>
          </Link>

          <Link href="/favoritos" className="flex flex-col">
            <div className="flex h-20 w-20 flex-col items-center rounded-lg border border-zinc-400 bg-[var(--green-600)] p-4">
              <Star width={56} height={56} color="#20FC8F" />
              <p className="text-white">Fav</p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}