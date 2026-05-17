// This route group is unused — the main layout is at app/layout.tsx.
// Keeping as a passthrough to prevent build errors.
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
