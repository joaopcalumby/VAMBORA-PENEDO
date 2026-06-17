"use client";

import { useEffect, useRef, useState } from "react";

type QrScannerModule = typeof import("qr-scanner").default;

type Props = {
  onDecoded: (code: string) => void;
  onError?: (message: string) => void;
};

// Wrapper em torno da lib qr-scanner — carrega o módulo dinamicamente
// para evitar SSR e mantém o lifecycle do stream de câmera amarrado ao
// mount do componente.
export function QrScanner({ onDecoded, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<InstanceType<QrScannerModule> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const QrScannerImpl = (await import("qr-scanner")).default;
        if (!active || !videoRef.current) return;

        const scanner = new QrScannerImpl(
          videoRef.current,
          (result) => onDecoded(result.data),
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment",
            returnDetailedScanResult: true,
          }
        );
        scannerRef.current = scanner;
        await scanner.start();
        if (active) setStatus("ready");
      } catch (err) {
        if (!active) return;
        setStatus("error");
        const msg =
          err instanceof Error ? err.message : "Não foi possível acessar a câmera.";
        onError?.(msg);
      }
    })();

    return () => {
      active = false;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [onDecoded, onError]);

  return (
    <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
          Solicitando câmera...
        </div>
      )}
    </div>
  );
}
