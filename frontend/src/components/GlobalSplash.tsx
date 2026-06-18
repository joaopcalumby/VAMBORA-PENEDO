"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function GlobalSplash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Esconde a splash screen após 1.2s do carregamento inicial (refresh ou primeira visita)
    const timer = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-primary-500">
      <div className="flex flex-col items-center gap-4 page-enter">
        <Image
          src="/logo-nova.png"
          alt="Vambora Penedo"
          width={120}
          height={120}
          priority
          style={{ width: "auto", height: "auto" }}
        />
      </div>
    </div>
  );
}
