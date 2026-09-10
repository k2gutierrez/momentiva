import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import { confirmMercadoPagoPayment } from "@/actions/checkout";
import Link from "next/link";
import { ClockIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function PagoPendientePage({
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
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <ClockIcon size={48} weight="bold" />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-berenjena mb-3">
          Tu pago está pendiente de acreditación
        </h2>

        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Esto suele pasar con pagos en OXXO o transferencia SPEI: tu pedido ya quedó registrado y lo
          procesaremos en cuanto el pago se acredite. Te contactaremos por WhatsApp para confirmar todo.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/mi-cuenta"
            className="bg-terracota hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Ver mis pedidos
          </Link>
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
