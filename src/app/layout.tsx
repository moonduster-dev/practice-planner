import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import MainWrapper from "@/components/shared/MainWrapper";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GC Falcons Practice Planner",
  description: "Plan and manage softball practices - Our Lady of Good Counsel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <AuthProvider>
          <Navbar />
          <MainWrapper>
            {children}
          </MainWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
