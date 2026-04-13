import type { Metadata } from "next";
import { Geist_Mono, Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VamBora - Penedo",
  description: "VamBora Penedo é um aplicativo de turismo que oferece uma experiência imersiva e personalizada para os visitantes de Penedo, Alagoas. Com uma interface intuitiva e recursos inovadores, o aplicativo ajuda os usuários a explorar as belezas naturais, culturais e históricas da região, proporcionando uma jornada única e inesquecível.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      className={`${kanit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="app-page min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
