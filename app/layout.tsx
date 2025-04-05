// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "../components/Navigation";
import Footer from "@/components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cashtags Dashboard",
  description: "A stock market dashboard",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><meta httpEquiv="Cache-Control" content="no-store, no-cache, must-revalidate" /><meta httpEquiv="Pragma" content="no-cache" /><meta httpEquiv="Expires" content="0" /><link rel="icon" href="/favicon.ico" type="image/x-icon" /><link rel="apple-touch-icon" href="/apple-touch-icon.png" /><link rel="manifest" href="/favicon_io/site.webmanifest" /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 min-h-screen flex flex-col`}>
        <Navigation />
        <main className="container mx-auto px-6 pt-20 pb-6 max-w-4xl text-gray-200 flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}