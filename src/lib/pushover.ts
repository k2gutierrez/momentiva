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
