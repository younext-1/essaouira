import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Playfair_Display, Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/lib/auth/profile-provider";
import { AuthModalProvider } from "@/store/useAuthModal";
import { NarrowSidebar } from "@/components/layout/NarrowSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SignInModal } from "@/components/ui/SignInModal";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "Mogador Connect | Digital Hub",
  description: "Experience the timeless allure of Essaouira's ancient ramparts and the exhilarating pulse of its Atlantic winds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" dir="ltr" className={`${playfair.variable} ${inter.variable} ${arabic.variable} h-full antialiased`}>
        <body className="h-full bg-warm-white text-text-primary overflow-hidden">
          <ProfileProvider>
            <AuthModalProvider>
              <div className="flex h-screen w-full bg-warm-white">
                <div className="hidden md:flex h-full shrink-0 border-r border-warm-border bg-white z-50">
                  <NarrowSidebar />
                </div>
                <div className="flex-1 flex flex-col relative h-full min-w-0">
                  <TopBar />
                  <main className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
                    {children}
                  </main>
                  <div className="md:hidden">
                    <BottomNav />
                  </div>
                </div>
              </div>
              <SignInModal />
            </AuthModalProvider>
          </ProfileProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
