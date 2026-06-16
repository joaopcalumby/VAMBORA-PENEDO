import TabBar from "@/components/navigation/TabBar";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="min-h-[100dvh] pb-24 sm:pb-28">{children}</div>
      <TabBar />
    </>
  );
}