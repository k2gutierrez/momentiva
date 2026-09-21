import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentInfo } from "@/lib/mercadopago";
import crypto from "node:crypto";

/**
 * Valida la firma con el esquema oficial de Mercado Pago:
 *   header x-signature: "ts=<timestamp>,v1=<hmac>"
 *   manifest           = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
 *   hmac               = HMAC_SHA256(secreto, manifest)
 *
 * Antes se comparaba el header completo contra un HMAC del cuerpo, así que
 * cualquier notificación legítima se rechazaba con 401 (y sin secreto no se
 * validaba nada).
 */
function firmaValida(request: NextRequest, dataId: string | null): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    // Sin secreto no se puede verificar: se rechaza (fail closed) en vez de aceptar todo.
    console.error("[MercadoPago] Falta MERCADO_PAGO_WEBHOOK_SECRET: webhook rechazado.");
    return false;
  }

  const header = request.headers.get("x-signature") || "";
  const partes = new Map(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()] as const;
    })
  );
  const ts = partes.get("ts");
  const v1 = partes.get("v1");
  if (!ts || !v1 || !dataId) return false;

  const manifest = `id:${dataId};request-id:${request.headers.get("x-request-id") || ""};ts:${ts};`;
  const esperado = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(esperado, "utf8");
  const b = Buffer.from(v1, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Webhook de Mercado Pago: recibe notificaciones de pago (type=payment)
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText || "{}");

    // El id puede venir en el cuerpo o como parámetro de la URL
    const dataIdCrudo =
      request.nextUrl.searchParams.get("data.id") || body?.data?.id || null;
    const dataId = dataIdCrudo ? String(dataIdCrudo) : null;

    if (!firmaValida(request, dataId)) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    // Solo interesan las notificaciones de pago y el id debe ser numérico
    // (se usa para consultar la API de Mercado Pago, así que no se interpola texto libre)
    if (body.type === "payment" && dataId && /^\d+$/.test(dataId)) {
      const info = await getPaymentInfo(dataId);

      if (info?.externalReference) {
        const admin = createAdminClient();
        const supabase = admin ?? (await createClient());

        const devuelto =
          info.status === "refunded" || info.status === "charged_back";

        const paymentStatus = info.status === "approved"
          ? "paid"
          : devuelto
          ? "refunded"
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
