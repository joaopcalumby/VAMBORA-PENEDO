import Image from "next/image";
import Link from "next/link";
import { MoveRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative flex h-screen flex-col items-center justify-around overflow-hidden bg-gradient-to-t from-[#304643] to-[#1D2927]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#20FC8F]/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#20FC8F]/10 blur-3xl animate-pulse" />

      <Link
        href="/loginPage"
        className="z-10 w-full rounded px-4 py-2 text-center text-white font-medium"
      >
        <section className="flex h-screen flex-col items-center justify-around">
          <div />

          <div className="logo-float page-enter">
            <Image
              src="/logovambora.svg"
              alt="Hero Image"
              width={220}
              height={220}
              priority
            />
          </div>

          <p className="flex justify-center text-m items-center page-enter text-lg gap-2 text-white/95">
            Clique para prosseguir <MoveRight />
          </p>
        </section>
      </Link>
    </main>
  );
}
