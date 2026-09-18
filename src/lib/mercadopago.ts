import "server-only";

// Integración con Mercado Pago (Checkout Pro)
// Docs: https://www.mercadopago.com.mx/developers/es/reference/preferences/_checkout_preferences/post

const MP_API_BASE = "https://api.mercadopago.com";

export interface MPPreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
}

export interface CreatePreferenceParams {
  orderId: string;
  items: MPPreferenceItem[];
  payerName?: string;
  origin: string;
}

export interface CreatePreferenceResult {
  initPoint: string;
  preferenceId: string;
}

export async function createPaymentPreference({
  orderId,
  items,
  payerName,
  origin,
}: CreatePreferenceParams): Promise<CreatePreferenceResult> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Mercado Pago no está configurado: falta MERCADO_PAGO_ACCESS_TOKEN.");
  }

  const notificationUrl = origin
    ? `${origin}/api/webhooks/mercado-pago`
    : undefined;

  const body: Record<string, unknown> = {
    items: items.map((item) => ({
      title: item.title.slice(0, 255),
      quantity: item.quantity,
      unit_price: Number(item.unit_price.toFixed(2)),
    })),
    external_reference: orderId,
    back_urls: {
      success: `${origin}/pago/exito`,
      pending: `${origin}/pago/pendiente`,
      failure: `${origin}/pago/error`,
    },
    auto_return: "approved",
    statement_descriptor: "Momentiva",
  };

  if (payerName) {
    body.payer = { name: payerName };
  }
  if (notificationUrl) {
    body.notification_url = notificationUrl;
  }

  const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok || !data?.init_point) {
    throw new Error(
      (data && typeof data.message === "string" && data.message) ||
        "No se pudo crear el pago en Mercado Pago."
    );
  }

  return {
    // OJO: Mercado Pago devuelve SIEMPRE los dos enlaces, incluso en producción:
    //   init_point         -> checkout real  (www.mercadopago.com.mx)
    //   sandbox_init_point -> checkout de pruebas (sandbox.mercadopago.com.mx)
    // Antes se prefería el de sandbox, así que con credenciales de producción los
    // clientes habrían ido al checkout de pruebas y NINGUNA tarjeta real cobraba.
    // Ahora se decide por el tipo de credencial: TEST- = pruebas, APP_USR- = real.
    initPoint:
      token.startsWith("TEST-") && data.sandbox_init_point
        ? (data.sandbox_init_point as string)
        : (data.init_point as string),
    preferenceId: data.id as string,
  };
}

export interface MPPaymentInfo {
  status: string;
  statusDetail: string;
  externalReference: string | null;
  paymentMethodId: string | null;
}

export async function getPaymentInfo(paymentId: string): Promise<MPPaymentInfo | null> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return null;

  const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    status: String(data.status || ""),
    statusDetail: String(data.status_detail || ""),
    externalReference: data.external_reference || null,
    paymentMethodId: data.payment_method_id || null,
  };
}
