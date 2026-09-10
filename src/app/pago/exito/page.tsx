import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import { confirmMercadoPagoPayment } from "@/actions/checkout";
import Link from "next/link";
import { CheckCircleIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function PagoExitoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const paymentId = sp.payment_id || sp.collection_id || "";

  let status = "";
  if (paymentId) {
    const result = await confirmMercadoPagoPayment(paymentId);
    status = result.status || "";
  }

  const approved = status === "approved";

  return (
    <main className="bg-cream min-h-screen flex flex-col">
      <ClearCartOnMount />
      <Header />
      <div className="flex-1 max-w-2xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center w-full">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${approved ? "bg-sage/20 text-sage" : "bg-amber-100 text-amber-600"}`}>
          {approved ? <CheckCircleIcon size={48} weight="fill" /> : <ClockIcon size={48} weight="bold" />}
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-berenjena mb-3">
          {approved ? "¡Pago aprobado! 🎉" : "Estamos confirmando tu pago…"}
        </h2>

        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          {approved
            ? "¡Muchas gracias por tu compra! Recibimos tu pedido y tu pago. Nos pondremos en contacto por WhatsApp para coordinar la entrega."
            : "Tu pago está en proceso de acreditación. En cuanto Mercado Pago lo confirme, prepararemos tu pedido y te contactamos por WhatsApp."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/mi-cuenta"
            className="bg-terracota hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/tienda"
            className="bg-white text-berenjena font-bold px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all"
          >
            Seguir explorando
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
