import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthInitializer from "@/components/auth-initializer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EyeLens Companion",
  description: "Companion app for UPI glasses",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-white text-gray-800`}>
        <AuthInitializer />
        <div className="min-h-screen pb-16 max-w-md mx-auto">{children}</div>
        <Toaster richColors={false} position="top-center" />
      </body>
    </html>
  );
}
