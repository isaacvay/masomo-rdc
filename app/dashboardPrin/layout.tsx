import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Masomo RDC - Dashboard",
  description: "Application éducative pour la RDC",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className}  bg-gray-100 min-h-screen`}>
      {children}
    </div>
  );
}