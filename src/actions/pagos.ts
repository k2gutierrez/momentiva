"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ipDelVisitante, limitarIntentos } from "@/lib/rateLimit";
import { confirmMercadoPagoPayment } from "@/actions/checkout";

/**
 * Cobra un pedido con tarjeta SIN salir de la tienda (Payment Brick).
 *
 * Cómo funciona y por qué es seguro:
 * - El navegador nunca nos manda el número de tarjeta: Mercado Pago le devuelve un
 *   TOKEN de un solo uso (los campos de tarjeta son de Mercado Pago, no nuestros).
 * - El MONTO no se toma del navegador: se lee del pedido ya guardado en la base.
 * - El pedido debe estar pendiente y ser reciente (evita repetir cobros viejos).
 * - Al final se reutiliza `confirmMercadoPagoPayment`, que valida con Mercado Pago y
 *   deja el pedido al día (igual que el webhook).
 *
 * ⚠️ ESTA ACCIÓN NO SE USA TODAVÍA: el Brick está deshabilitado hasta que se
 * configure NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY. Cuando se active, hay que hacer una
 * pasada de pruebas con tarjetas reales (incluido el reto 3DS).
 */
export async function pagarPedidoConTarjeta(datos: {
  orderId: string;
  token: string;
  paymentMethodId: string;
  installments?: number;
  issuerId?: string;
  payerEmail?: string;
  identificacion?: { type?: string; number?: string };
}) {
  try {
    // Freno antiabuso: crear pagos es caro, así que se limita por IP.
    const ip = ipDelVisitante(await headers());
    const limite = limitarIntentos(`pago-tarjeta:${ip}`, 10, 60_000);
    if (!limite.permitido) {
      return { ok: false, status: "", error: limite.mensaje || "Demasiados intentos." };
    }

    const token = String(datos.token || "").trim();
    const metodo = String(datos.paymentMethodId || "").trim();
    if (!datos.orderId || !token || !metodo) {
      return { ok: false, status: "", error: "Faltan datos del pago." };
    }

    const admin = createAdminClient();
    if (!admin) return { ok: false, status: "", error: "Configuración incompleta." };

    // El monto y el correo salen del PEDIDO (nunca del navegador).
    const { data: pedido } = await admin
      .from("orders")
      .select("id, total_amount, payment_status, created_at, delivery_address")
      .eq("id", datos.orderId)
      .maybeSingle();

    if (!pedido) return { ok: false, status: "", error: "No encontramos el pedido." };
    if (pedido.payment_status && pedido.payment_status !== "pending") {
      return { ok: false, status: "", error: "Este pedido ya tiene un pago registrado." };
    }

    // Solo pedidos recientes: evita que alguien intente cobrar pedidos viejos.
    const horas = (Date.now() - new Date(pedido.created_at).getTime()) / 36e5;
    if (horas > 6) {
      return { ok: false, status: "", error: "El pedido expiró. Vuelve a intentarlo." };
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const siteUrl = process.env.SITE_URL || "https://momentiva.com.mx";
    if (!accessToken) return { ok: false, status: "", error: "Configuración incompleta." };

    const direccion = (pedido.delivery_address || {}) as Record<string, unknown>;
    const correo = datos.payerEmail || (direccion["correoContacto"] as string) || undefined;

    const cuerpo: Record<string, unknown> = {
      // El monto SIEMPRE del pedido guardado
      transaction_amount: Number(pedido.total_amount),
      token,
      description: `Momentiva · pedido ${String(pedido.id).slice(0, 8)}`,
      installments: Number(datos.installments) || 1,
      payment_method_id: metodo,
      external_reference: pedido.id,
      notification_url: `${siteUrl}/api/webhooks/mercado-pago`,
      statement_descriptor: "MOMENTIVA",
    };
    if (datos.issuerId) cuerpo.issuer_id = datos.issuerId;
    if (correo) cuerpo.payer = { email: correo };
    if (datos.identificacion?.number) {
      cuerpo.payer = {
        ...(cuerpo.payer as object),
        identification: {
          type: datos.identificacion.type || "RFC",
          number: datos.identificacion.number,
        },
      };
    }

    const respuesta = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${pedido.id}-${Date.now()}`,
      },
      body: JSON.stringify(cuerpo),
    });

    const pago = (await respuesta.json()) as {
      id?: number | string;
      status?: string;
      status_detail?: string;
      message?: string;
      transaction_details?: { external_resource_url?: string };
    };

    if (!respuesta.ok || !pago?.id) {
      console.error("[PagoBrick] error de Mercado Pago:", JSON.stringify(pago).slice(0, 300));
      return {
        ok: false,
        status: "",
        error: pago?.message || "No se pudo procesar el pago con la tarjeta.",
      };
    }

    // Deja el pedido al día (misma lógica que el webhook)
    await confirmMercadoPagoPayment(String(pago.id));

    return {
      ok: true,
      paymentId: String(pago.id),
      status: pago.status || "pending",
      statusDetail: pago.status_detail || "",
      // Pagos en efectivo (OXXO): Mercado Pago devuelve la ficha con el código
      voucherUrl: pago.transaction_details?.external_resource_url || "",
      error: "",
    };
  } catch (error: unknown) {
    console.error("[PagoBrick] excepción:", error);
    return {
      ok: false,
      status: "",
      error: "No se pudo procesar el pago. Inténtalo de nuevo.",
    };
  }
}
