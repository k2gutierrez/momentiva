import type { Metadata } from "next";
import { Nunito, Caveat } from "next/font/google"; // Using Caveat as the handwriting font
import "./globals.css";
import { Provider as JotaiProvider } from 'jotai';
import { Toaster } from 'sonner';
import AuthProvider from "@/components/AuthProvider";
import CartDrawer from "@/components/CartDrawer";
import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";

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
  description: "Momentos que se quedan por más tiempo. Regalos personalizados y globos burbuja con aire —no helio— que acompañan tus celebraciones por semanas. Entregamos en Guadalajara, Zapopan y Tlajomulco de Zúñiga.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${nunito.variable} ${caveat.variable} font-sans bg-cream text-berenjena antialiased relative`}>
        <JotaiProvider>
          <AuthProvider>
            <CartDrawer />
            <Toaster position="bottom-right" richColors />

            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">{children}</main>
            </div>

            {/* Botón Flotante de WhatsApp Business */}
            <a
              href="https://wa.me/523349427375?text=Hola%20Momentiva%2C%20quiero%20cotizar%20un%20regalo%20%F0%9F%8E%88"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-3 md:p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center animate-fade-in-up"
              aria-label="Contactar por WhatsApp"
            >
              <WhatsappLogoIcon size={32} weight="fill" />
            </a>

          </AuthProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
