import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blank Wars - Battle & Bond with _____ Warriors",
  description: "The revolutionary TCG where you battle and form emotional connections with AI-powered characters from _____ times, _____ universes, and _____ origins.",
  keywords: "trading card game, AI chat, battles, blank wars, characters from any time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen text-white antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
