import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import { confirmMercadoPagoPayment } from "@/actions/checkout";
import Link from "next/link";
import { XCircleIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function PagoErrorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const paymentId = sp.payment_id || sp.collection_id || "";

  if (paymentId) {
    await confirmMercadoPagoPayment(paymentId);
  }

  return (
    <main className="bg-cream min-h-screen flex flex-col">
      <ClearCartOnMount />
      <Header />
      <div className="flex-1 max-w-2xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center w-full">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
          <XCircleIcon size={48} weight="bold" />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-berenjena mb-3">
          No se pudo completar el pago
        </h2>

        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Tu pedido quedó guardado como <strong>pendiente de pago</strong>. Puedes volver a intentarlo más
          tarde o escribirnos por WhatsApp y con gusto te ayudamos a completarlo.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://wa.me/523349427375?text=Hola%20Momentiva%2C%20necesito%20ayuda%20con%20mi%20pago"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Ayuda por WhatsApp
          </a>
          <Link
            href="/"
            className="bg-white text-berenjena font-bold px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
