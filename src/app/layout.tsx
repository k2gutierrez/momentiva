import type { Metadata } from "next";
import { Nunito, Caveat } from "next/font/google"; // Using Caveat as the handwriting font
import "./globals.css";
import { Provider as JotaiProvider } from 'jotai';
import { Toaster } from 'sonner';
import AuthProvider from "@/components/AuthProvider";
import CartDrawer from "@/components/CartDrawer";

// Initialize fonts
const nunito = Nunito({
  subsets: ["latin"],
  variable: '--font-nunito'
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: '--font-handwriting'
});

export const metadata: Metadata = {
  title: "Momentiva | Cada regalo, un momento inolvidable",
  description: "Regalos personalizados y repostería en Guadalajara",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${nunito.variable} ${caveat.variable} font-sans bg-cream text-berenjena antialiased`}>
        <JotaiProvider>
          <AuthProvider>
            <CartDrawer />
            <Toaster position="bottom-right" richColors />
            {children}
            {/* Sonner Toaster for DB operation notifications[cite: 1] */}
          </AuthProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
