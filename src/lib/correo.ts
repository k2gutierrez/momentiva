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
 *   SMTP_PORT  (opcional: 465 por defecto; si falla se reintenta en 587)
 */

/** Datos del servidor de correo, sin exponer la contraseña. */
export function configuracionCorreo() {
  return {
    host: process.env.SMTP_HOST || "",
    user: process.env.SMTP_USER || "",
    tieneContrasena: Boolean(process.env.SMTP_PASS),
    puerto: Number(process.env.SMTP_PORT || 465),
  };
}

type Mensaje = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function enviar(
  mensaje: Mensaje,
  puertoPreferido: number
): Promise<{ ok: boolean; puerto?: number; error?: string }> {
  const host = process.env.SMTP_HOST || "";
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!host || !user || !pass) {
    return { ok: false, error: "Faltan SMTP_HOST, SMTP_USER o SMTP_PASS." };
  }

  // Primero el puerto configurado; si el hosting lo bloquea, se reintenta en el otro
  // (465 = SSL directo, 587 = STARTTLS). Es la causa más común de que no salga correo.
  const puertos = puertoPreferido === 587 ? [587, 465] : [puertoPreferido, 587];
  let ultimoError = "";

  for (const puerto of puertos) {
    try {
      const transporte = nodemailer.createTransport({
        host,
        port: puerto,
        secure: puerto === 465,
        auth: { user, pass },
        connectionTimeout: 15000,
      });
      await transporte.sendMail(mensaje);
      return { ok: true, puerto };
    } catch (error) {
      ultimoError = error instanceof Error ? error.message : String(error);
      console.error(`[Correo] Falló el envío por el puerto ${puerto}: ${ultimoError}`);
    }
  }
  return { ok: false, error: ultimoError };
}

export async function enviarCorreoPedidoPagado(datos: DatosPedidoCorreo): Promise<boolean> {
  const { host, user, puerto } = configuracionCorreo();

  if (!host || !user || !datos.correoCliente) {
    console.warn(
      "[Correo] No se envió el correo del pedido: falta configurar SMTP_HOST / SMTP_USER / SMTP_PASS o el correo del cliente."
    );
    return false;
  }

  const resultado = await enviar(
    {
      from: `"Momentiva" <${user}>`,
      to: datos.correoCliente,
      subject: `¡Gracias por tu compra! Pedido ${datos.numeroPedido} · Momentiva`,
      html: plantillaPedidoPagado(datos),
      text:
        `¡Gracias por tu compra!\n\n` +
        `Pedido ${datos.numeroPedido} · ${datos.fecha}\n` +
        `Total pagado: $${Number(datos.total).toFixed(2)} MXN\n` +
        (datos.fechaEntrega
          ? `Entrega: ${datos.fechaEntrega}${datos.horarioEntrega ? ` · ${datos.horarioEntrega}` : ""}\n`
          : "") +
        `\nTe escribiremos por WhatsApp para coordinar la entrega.\n` +
        `Momentiva · Cada regalo, un momento inolvidable`,
    },
    puerto
  );

  if (resultado.ok) {
    console.log(
      `[Correo] Pedido ${datos.numeroPedido} enviado a ${datos.correoCliente} (puerto ${resultado.puerto})`
    );
    return true;
  }

  console.error(`[Correo] No se pudo enviar el correo del pedido: ${resultado.error}`);
  return false;
}

/**
 * Envía un correo de prueba al correo que se indique y devuelve el detalle.
 * Sirve para saber exactamente por qué no está saliendo el correo de los pedidos.
 */
export async function enviarCorreoDePrueba(destino: string): Promise<{
  ok: boolean;
  puerto?: number;
  error?: string;
  config: ReturnType<typeof configuracionCorreo>;
}> {
  const config = configuracionCorreo();

  if (!config.host || !config.user || !config.tieneContrasena) {
    return {
      ok: false,
      error: "Falta alguna de las variables SMTP_HOST / SMTP_USER / SMTP_PASS en Hostinger.",
      config,
    };
  }

  const resultado = await enviar(
    {
      from: `"Momentiva" <${config.user}>`,
      to: destino,
      subject: "Prueba de correo · Momentiva",
      html: `<p style="font-family:sans-serif">Si estás leyendo esto, el correo de la tienda <strong>ya funciona</strong>. 💜</p>`,
      text: "Si estás leyendo esto, el correo de la tienda ya funciona.",
    },
    config.puerto
  );

  return { ...resultado, config };
}
