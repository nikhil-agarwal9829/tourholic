import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TravelAssistantWidget from "@/components/chatbot/TravelAssistantWidget";
import { AuthProvider } from "@/components/auth/AuthProvider";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Touroholic — Curated Small-Group Tours & Expeditions",
  description:
    "Discover handpicked, small-group adventure and cultural tours. From Banff's alpine lakes to Serengeti safaris and Kyoto heritage.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#fbfaf8] text-[#1c2421]">
        <AuthProvider>
          <EmailVerificationBanner />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <TravelAssistantWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
