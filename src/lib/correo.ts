import nodemailer from "nodemailer";
import { plantillaPedidoPagado, type DatosPedidoCorreo } from "@/lib/plantillaPedido";

/**
 * Envía al CLIENTE el correo de "pedido pagado".
 *
 * - Se manda solo cuando el pago se aprueba (nunca al crear el pedido).
 * - Las dueñas NO reciben copia: para eso está el panel y la notificación Pushover.
 * - Si las variables del servidor de correo no están configuradas, no falla nada: se
 *   omite el envío y se deja constancia en los registros.
 *
 * Variables necesarias en Hostinger:
 *   SMTP_HOST  (por ejemplo smtp.hostinger.com)
 *   SMTP_USER  (el correo, por ejemplo no-reply@momentiva.com.mx)
 *   SMTP_PASS  (la contraseña del buzón)
 *   SMTP_PORT  (opcional: 465 por defecto, con SSL)
 */
export async function enviarCorreoPedidoPagado(datos: DatosPedidoCorreo): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 465);

  if (!host || !user || !pass || !datos.correoCliente) {
    console.warn(
      "[Correo] No se envió el correo del pedido: faltan SMTP_HOST/SMTP_USER/SMTP_PASS o el correo del cliente."
    );
    return false;
  }

  try {
    const transporte = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 usa SSL directo; 587 empieza sin cifrar y sube con STARTTLS
      auth: { user, pass },
    });

    await transporte.sendMail({
      from: `"Momentiva" <${user}>`,
      to: datos.correoCliente,
      subject: `¡Gracias por tu compra! Pedido ${datos.numeroPedido} · Momentiva`,
      html: plantillaPedidoPagado(datos),
      text:
        `¡Gracias por tu compra!\n\n` +
        `Pedido ${datos.numeroPedido} · ${datos.fecha}\n` +
        `Total pagado: $${Number(datos.total).toFixed(2)} MXN\n` +
        (datos.fechaEntrega ? `Entrega: ${datos.fechaEntrega}${datos.horarioEntrega ? ` · ${datos.horarioEntrega}` : ""}\n` : "") +
        `\nTe escribiremos por WhatsApp para coordinar la entrega.\n` +
        `Momentiva · Cada regalo, un momento inolvidable`,
    });

    console.log(`[Correo] Pedido ${datos.numeroPedido} enviado a ${datos.correoCliente}`);
    return true;
  } catch (error) {
    console.error("[Correo] No se pudo enviar el correo del pedido:", error);
    return false;
  }
}
