import type { Metadata } from "next";
import { Playfair_Display, Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TopBar } from "@/components/layout/TopBar";

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
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${arabic.variable} light h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-brand-off-white text-brand-dark-text selection:bg-brand-saffron/30 selection:text-brand-deep-ocean overflow-x-hidden">
        <Sidebar />
        <TopBar />
        <main className="flex-1 md:ml-[280px] pb-24 md:pb-8 max-w-[100vw] overflow-hidden">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
