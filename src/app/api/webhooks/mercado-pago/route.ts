import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentInfo } from "@/lib/mercadopago";
import crypto from "node:crypto";

// Webhook de Mercado Pago: recibe notificaciones de pago (type=payment)
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();

    // Verificación de firma (solo si se configuró MERCADO_PAGO_WEBHOOK_SECRET)
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (secret) {
      const ts = request.headers.get("x-request-id") || "";
      const sig = request.headers.get("x-signature") || "";
      const expected = crypto
        .createHmac("sha256", secret)
        .update(`${ts}.${bodyText}`)
        .digest("hex");
      if (!sig || sig !== expected) {
        return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
      }
    }

    const body = JSON.parse(bodyText || "{}");

    // Solo nos interesan las notificaciones de pago
    if (body.type === "payment" && body.data?.id) {
      const info = await getPaymentInfo(String(body.data.id));

      if (info?.externalReference) {
        const admin = createAdminClient();
        const supabase = admin ?? (await createClient());

        const paymentStatus =
          info.status === "approved"
            ? "paid"
            : info.status === "rejected"
            ? "rejected"
            : "pending";

        const orderStatus =
          info.status === "approved" ? "work_in_progress" : "placed";

        await supabase
          .from("orders")
          .update({ payment_status: paymentStatus, status: orderStatus })
          .eq("id", info.externalReference);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando webhook de Mercado Pago:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
