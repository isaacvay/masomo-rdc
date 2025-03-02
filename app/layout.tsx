import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import CookieBanner from "./cookies/CookieBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Masomo RDC",
  description: "Application éducative pour la RDC",
  icons: {
    icon: "/images/icon0.ico",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-50`} suppressHydrationWarning>
        <Navbar />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
