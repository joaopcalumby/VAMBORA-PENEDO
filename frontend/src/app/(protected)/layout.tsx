import TabBar from "@/components/navigation/TabBar";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <TabBar />
    </>
  );
}