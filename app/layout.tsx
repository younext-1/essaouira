import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Outfit, DM_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import Providers from "@/components/Providers";
import SocialProofToasts from "@/components/SocialProofToasts";
import GlobalChatbot from "@/components/GlobalChatbot";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-display" 
});

const dmSans = DM_Sans({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans" 
});

export const metadata: Metadata = {
  title: "Mogador Craft | Premium Moroccan Artisan Marketplace",
  description: "Explore and buy authentic, high-quality Moroccan handcrafted items direct from local artisans in the Essaouira Medina. Safely delivered worldwide with direct fair trade payments.",
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <ClerkProvider>
      <html 
        lang="en" 
        dir="ltr" 
        className={`${outfit.variable} ${dmSans.variable} h-full antialiased`}
      >
        <body className="h-full bg-[#FAFAF7] text-[#1C1917] font-sans antialiased">
          <Providers>
            <div className="min-h-screen flex flex-col relative w-full bg-[#FAFAF7]">
              <Navbar />
              <main className="flex-1 w-full relative">
                {children}
              </main>
              <Footer />
              <BottomNav />
              {/* <SocialProofToasts /> */}
              <GlobalChatbot />
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
