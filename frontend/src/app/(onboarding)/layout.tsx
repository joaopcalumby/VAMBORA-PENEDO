// Route group sem TabBar — telas de onboarding ocupam toda a viewport.
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh">{children}</div>;
}
