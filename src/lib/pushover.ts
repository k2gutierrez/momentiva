/**
 * Aviso al celular de las dueñas cuando un pedido se PAGA.
 *
 * Se manda **solo cuando el pago está aprobado** (no al crear el pedido), para que
 * no les llegue un aviso de algo que todavía no está cobrado.
 */
export async function avisarPedidoPagado(datos: {
  total: number;
  nombreRecibe?: string;
  telefonoRecibe?: string;
  nombreEnvia?: string;
  telefonoEnvia?: string;
  fecha?: string;
  horario?: string;
  codigoPostal?: string;
  esSorpresa?: boolean;
}): Promise<void> {
  const token = process.env.PUSHOVER_APP_TOKEN;
  const user = process.env.PUSHOVER_USER_KEY;
  if (!token || !user) return;

  const lineas = [
    `Entrega: ${datos.nombreRecibe || "cliente"}${
      datos.telefonoRecibe ? ` (${datos.telefonoRecibe})` : ""
    }`,
    `Envía: ${datos.nombreEnvia || "—"}${datos.telefonoEnvia ? ` (${datos.telefonoEnvia})` : ""}`,
    `Total: $${Number(datos.total || 0).toFixed(2)} MXN · PAGADO ✅`,
    `Fecha: ${datos.fecha || "—"}${datos.horario ? ` · ${datos.horario}` : ""}`,
    datos.codigoPostal ? `C.P.: ${datos.codigoPostal}` : "",
    datos.esSorpresa ? "🎁 REGALO SORPRESA" : "",
  ].filter(Boolean);

  try {
    await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        user,
        title: "💰 ¡Pedido PAGADO en Momentiva!",
        message: lineas.join("\n"),
      }),
    });
  } catch (error) {
    console.error("[Pushover] no se pudo enviar el aviso:", error);
  }
}

/** Configuración del aviso al celular (sin exponer las claves). */
export function configuracionPushover() {
  return {
    tieneToken: Boolean(process.env.PUSHOVER_APP_TOKEN),
    tieneUsuario: Boolean(process.env.PUSHOVER_USER_KEY),
  };
}

/** Manda un aviso de prueba al celular y devuelve el resultado con detalle. */
export async function enviarAvisoDePrueba(): Promise<{
  ok: boolean;
  error?: string;
  config: ReturnType<typeof configuracionPushover>;
}> {
  const token = process.env.PUSHOVER_APP_TOKEN;
  const user = process.env.PUSHOVER_USER_KEY;
  const config = configuracionPushover();

  if (!token || !user) {
    return {
      ok: false,
      error: "Falta PUSHOVER_APP_TOKEN o PUSHOVER_USER_KEY en Hostinger.",
      config,
    };
  }

  try {
    const respuesta = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        user,
        title: "Prueba de Momentiva 🔔",
        message:
          "Si ves este aviso en el celular, las notificaciones de pedidos YA funcionan. 💜",
      }),
    });
    const datos = (await respuesta.json().catch(() => ({}))) as { errors?: string[]; status?: number };
    if (!respuesta.ok || (datos.status && datos.status !== 1)) {
      return {
        ok: false,
        error: `Pushover respondió ${respuesta.status}: ${(datos.errors || []).join(", ") || "sin detalle"}`,
        config,
      };
    }
    return { ok: true, config };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      config,
    };
  }
}
