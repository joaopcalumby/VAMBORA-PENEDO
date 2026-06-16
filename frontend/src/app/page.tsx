"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const duration = 5000;
    const timeout = window.setTimeout(() => {
      router.push("/login");
    }, duration);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#15211f] via-[#203330] to-[#0c1413] px-6">
      <section className="loader-center page-enter">
        <div className="loader-spinner">
          <div className="loader-spinner-track" />
          <div className="loader-spinner-fill" />
        </div>

        <div className="loader-logo logo-float">
          <div className="loader-logo-shell">
            <Image
              src="/logovambora.svg"
              alt="Vambora Penedo"
              width={160}
              height={160}
              priority
            />
          </div>
        </div>
      </section>
    </main>
  );
}
