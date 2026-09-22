/**
 * Plantilla del correo de "pedido pagado" que recibe el cliente.
 *
 * Reglas:
 * - Se envía SOLO al correo de quien compra (nunca al destinatario del regalo, para
 *   no arruinar la sorpresa).
 * - Todo el texto que viene del cliente (nombres, dirección) se escapa: si alguien
 *   escribe etiquetas HTML, se ven como texto y no rompen el correo.
 * - Estilos en línea y maquetado con tablas: así se ve bien en Gmail, Outlook, Apple
 *   Mail y el celular.
 */

export interface DatosPedidoCorreo {
  numeroPedido: string;
  fecha: string;
  articulos: { nombre: string; cantidad: number; precio: number; opciones?: string[] }[];
  subtotal: number;
  envio: number;
  descuento?: number;
  total: number;
  fechaEntrega?: string;
  horarioEntrega?: string;
  nombreRecibe?: string;
  telefonoRecibe?: string;
  direccion?: string;
  municipio?: string;
  esSorpresa?: boolean;
  nombreEnvia?: string;
  correoCliente: string;
}

const escapar = (valor: unknown): string =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const dinero = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function plantillaPedidoPagado(d: DatosPedidoCorreo): string {
  const filas = d.articulos
    .map(
      (a) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #EFE6F4;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#3B2142;">
            <strong>${escapar(a.nombre)}</strong>
            ${a.cantidad > 1 ? ` <span style="color:#7A6B80;">× ${a.cantidad}</span>` : ""}
            ${
              a.opciones && a.opciones.length > 0
                ? `<div style="margin-top:4px;font-size:12px;color:#7A6B80;line-height:1.5;">${a.opciones
                    .map((o) => escapar(o))
                    .join(" · ")}</div>`
                : ""
            }
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #EFE6F4;text-align:right;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#3B2142;white-space:nowrap;">
            ${dinero(a.precio * a.cantidad)}
          </td>
        </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5EFE6;margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:32px 12px;">

      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F5EFE6;font-size:1px;line-height:1px;">
        Recibimos tu pago. Tu pedido ${escapar(d.numeroPedido)} ya está en preparación.
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 2px 12px rgba(59,33,66,0.10);">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:30px 24px 6px 24px;background-color:#ffffff;">
            <img src="https://momentiva.com.mx/logo.png" alt="Momentiva" width="210" style="display:block;width:210px;max-width:70%;height:auto;border:0;" />
          </td>
        </tr>

        <!-- Título -->
        <tr>
          <td align="center" style="padding:10px 32px 0 32px;">
            <div style="width:64px;height:64px;border-radius:50%;background-color:#E7F0E4;line-height:64px;font-size:30px;margin:0 auto 14px auto;">✅</div>
            <h1 style="margin:0 0 8px 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;line-height:1.3;color:#3B2142;text-align:center;">
              ¡Gracias por tu compra!
            </h1>
            <p style="margin:0 0 6px 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#4A3A50;text-align:center;">
              Recibimos tu pago y <strong>tu pedido ya está en preparación</strong>.
            </p>
            <p style="margin:0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#7A6B80;text-align:center;">
              Pedido <strong>${escapar(d.numeroPedido)}</strong> · ${escapar(d.fecha)}
            </p>
          </td>
        </tr>

        <!-- Artículos -->
        <tr>
          <td style="padding:22px 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;color:#A79CAD;text-transform:uppercase;padding-bottom:6px;">
                  Tu pedido
                </td>
                <td></td>
              </tr>
              ${filas}
              <tr>
                <td style="padding:12px 0 4px 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#7A6B80;">Subtotal</td>
                <td style="padding:12px 0 4px 0;text-align:right;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#7A6B80;">${dinero(d.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:2px 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#7A6B80;">Envío</td>
                <td style="padding:2px 0;text-align:right;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#7A6B80;">${dinero(d.envio)}</td>
              </tr>
              ${
                d.descuento && d.descuento > 0
                  ? `<tr>
                <td style="padding:2px 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#7A6B80;">Descuento</td>
                <td style="padding:2px 0;text-align:right;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#7A6B80;">− ${dinero(d.descuento)}</td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding:10px 0 0 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;color:#3B2142;border-top:2px solid #EFE6F4;">Total pagado</td>
                <td style="padding:10px 0 0 0;text-align:right;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:bold;color:#C97B5F;border-top:2px solid #EFE6F4;white-space:nowrap;">${dinero(d.total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Entrega -->
        <tr>
          <td style="padding:22px 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5EFF6;border-radius:16px;">
              <tr>
                <td style="padding:16px 18px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                  <p style="margin:0 0 8px 0;font-size:12px;font-weight:bold;letter-spacing:1px;color:#A79CAD;text-transform:uppercase;">Entrega</p>
                  <p style="margin:0 0 4px 0;font-size:15px;color:#3B2142;font-weight:bold;">
                    📅 ${escapar(d.fechaEntrega || "Por confirmar")}${d.horarioEntrega ? ` · ${escapar(d.horarioEntrega)}` : ""}
                  </p>
                  ${
                    d.nombreRecibe
                      ? `<p style="margin:0 0 2px 0;font-size:14px;color:#4A3A50;">Recibe: <strong>${escapar(d.nombreRecibe)}</strong>${d.telefonoRecibe ? ` · ${escapar(d.telefonoRecibe)}` : ""}</p>`
                      : ""
                  }
                  ${
                    d.direccion
                      ? `<p style="margin:0;font-size:13px;color:#7A6B80;line-height:1.5;">${escapar(d.direccion)}${d.municipio ? `, ${escapar(d.municipio)}` : ""}</p>`
                      : ""
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${
          d.esSorpresa
            ? `<tr>
          <td style="padding:14px 32px 0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF3EC;border-radius:14px;">
              <tr>
                <td style="padding:14px 18px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#8A5A3B;text-align:center;">
                  🎁 <strong>Regalo sorpresa:</strong> no compartimos nada con quien lo recibe.
                  Coordinaremos la entrega contigo por WhatsApp.
                </td>
              </tr>
            </table>
          </td>
        </tr>`
            : ""
        }

        <!-- Qué sigue -->
        <tr>
          <td style="padding:20px 32px 0 32px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <p style="margin:0;font-size:14px;line-height:1.65;color:#4A3A50;text-align:center;">
              Te escribiremos por <strong>WhatsApp</strong> para coordinar la entrega.
              ¿Alguna duda? Responde a este correo y con gusto te ayudamos. 💜
            </p>
          </td>
        </tr>

        <!-- Pie -->
        <tr>
          <td style="padding:22px 32px 30px 32px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <div style="border-top:1px solid #EFE6F4;padding-top:16px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#A79CAD;text-align:center;">
                Momentiva · Cada regalo, un momento inolvidable<br />
                Guadalajara, Zapopan y Tlajomulco de Zúñiga, Jalisco<br />
                Este correo se envió a ${escapar(d.correoCliente)} porque hiciste una compra en momentiva.com.mx
              </p>
            </div>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>`;
}
