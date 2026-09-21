import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import { confirmMercadoPagoPayment } from "@/actions/checkout";
import EstadoPagoEnVivo from "@/components/EstadoPagoEnVivo";

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
      <EstadoPagoEnVivo paymentId={paymentId} estadoInicial="pending" />
      <Footer />
    </main>
  );
}
