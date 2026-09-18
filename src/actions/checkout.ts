"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { CartItem } from "@/store/cartStore";
import { createPaymentPreference, getPaymentInfo } from "@/lib/mercadopago";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { ipDelVisitante, limitarIntentos } from "@/lib/rateLimit";

export interface CheckoutDeliveryAddress {
  fullName: string;
  phone?: string;
  streetAddress?: string;
  notes?: string;
  municipality?: string;
  zoneName?: string;
  deliveryTime?: string;
  /** Fecha y hora que había elegido el cliente en cada producto del carrito. */
  fechasPorProducto?: { name: string; fecha: string; hora?: string }[];
  /** Quien envía el regalo (nombre y teléfono). */
  remitente?: { nombre?: string; telefono?: string };
  /** Quien recibe el regalo (nombre, teléfono y dirección). */
  destinatario?: { nombre?: string; telefono?: string; direccion?: string };
  /** El cliente marcó que es un regalo sorpresa. */
  esSorpresa?: boolean;
}

// Bucket PRIVADO donde viven las fotos que sube el cliente (fotos de personas).
const BUCKET_CLIENTES = "pedidos-clientes";

// Solo estos tipos se aceptan del navegador. Se excluye a propósito
// image/svg+xml: un SVG puede traer scripts y se serviría en el mismo origen
// que el panel de administración (XSS almacenado).
const TIPOS_CLIENTE_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

function tipoDataUrl(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const m = valor.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  if (!m) return null;
  const tipo = m[1].toLowerCase();
  return TIPOS_CLIENTE_PERMITIDOS.includes(tipo) ? tipo : null;
}

function esDataUrl(valor: unknown): valor is string {
  return tipoDataUrl(valor) !== null;
}

/** Sube un data URL al bucket privado y devuelve la ruta guardada (o null si falla). */
async function subirFotoPrivada(dataUrl: string, ruta: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    if (!admin) return null;

    const tipo = tipoDataUrl(dataUrl);
    if (!tipo) {
      console.warn("[Fotos] tipo de imagen rechazado (solo jpeg/png/webp)");
      return null;
    }
    const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
    if (!match) return null;

    const bytes = Buffer.from(match[1], "base64");
    const { error } = await admin.storage
      .from(BUCKET_CLIENTES)
      .upload(ruta, bytes, { contentType: tipo, upsert: true });

    if (error) {
      console.error("[Fotos] no se pudo subir al bucket privado:", error.message);
      return null;
    }
    return ruta;
  } catch (error) {
    console.error("[Fotos] error subiendo la imagen:", error);
    return null;
  }
}

/** Reemplaza por rutas del bucket privado cualquier foto que venga dentro de las opciones. */
async function subirImagenesDeOpciones(
  opciones: Record<string, unknown>,
  orderId: string,
  indice: number
): Promise<Record<string, unknown>> {
  const salida: Record<string, unknown> = { ...opciones };

  for (const [clave, valor] of Object.entries(salida)) {
    const base = `${orderId}/item-${indice + 1}-${clave.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    if (esDataUrl(valor)) {
      const ruta = await subirFotoPrivada(valor, `${base}.jpg`);
      if (ruta) salida[clave] = ruta;
      continue;
    }

    if (Array.isArray(valor) && valor.some(esDataUrl)) {
      salida[clave] = await Promise.all(
        valor.map(async (v, i) => {
          if (!esDataUrl(v)) return v;
          const ruta = await subirFotoPrivada(v, `${base}-${i + 1}.jpg`);
          return ruta || v;
        })
      );
    }
  }

  return salida;
}

export async function processCheckoutOrder(orderData: {
  deliveryZipCode: string;
  deliveryAddress: CheckoutDeliveryAddress;
  deliveryDate: string;
  couponCode?: string;
  discountAmount: number;
  deliveryFee: number;
  subtotal: number;
  totalAmount: number;
  totalCost: number;
  cartItems: CartItem[];
  origin: string;
}) {
  const supabase = await createClient();

  try {
    // Límite de intentos por IP: cada llamada crea un pedido, una preferencia de
    // Mercado Pago, sube fotos y manda notificaciones.
    const ip = ipDelVisitante(await headers());
    const limite = limitarIntentos(`checkout:${ip}`, 10, 60_000);
    if (!limite.permitido) {
      throw new Error(limite.mensaje || "Demasiados intentos. Inténtalo más tarde.");
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Si hay cupón aplicado, buscamos su id en la tabla discounts
    let discountId: string | null = null;
    if (orderData.couponCode) {
      const { data: discount } = await supabase
        .from("discounts")
        .select("id")
        .eq("code", orderData.couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();
      discountId = discount?.id || null;
    }

    // 0. Origen confiable para las URL de regreso y de notificación de Mercado Pago.
    //    El navegador puede mandar cualquier dominio, así que se usa el del sitio.
    const HOSTS_PERMITIDOS = [
      "momentiva.com.mx",
      "www.momentiva.com.mx",
      "momentiva.marmolymiel.com.mx",
    ];
    const origenConfiable = (() => {
      const configurado = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
      if (configurado) return configurado;
      try {
        const url = new URL(orderData.origin);
        if (
          HOSTS_PERMITIDOS.includes(url.hostname) ||
          url.hostname === "localhost" ||
          url.hostname === "127.0.0.1"
        ) {
          return `${url.protocol}//${url.host}`;
        }
      } catch {
        /* origen inválido: se usa el de producción */
      }
      return "https://momentiva.com.mx";
    })();

    // 1. Id del pedido generado por el servidor (así no necesitamos leer la fila creada,
    //    lo que es compatible con RLS para visitantes)
    const orderId = randomUUID();

    // 1-bis. PRECIOS DEL SERVIDOR.
    // Nunca se confía en los precios que manda el navegador: cualquiera puede
    // fabricar una petición con unitPrice = 1. Aquí se leen los precios, el costo
    // de envío y el cupón desde la base y se recalculan los totales. Lo que mande
    // el cliente solo se usa para comparar y dejar rastro en los logs.
    const precioClient = createAdminClient() ?? supabase;

    const productIds = orderData.cartItems.map((item) => item.productId);
    const { data: prodRows } = await precioClient
      .from("products")
      .select("id, name, price, is_active")
      .in("id", productIds);

    const prodById = new Map(
      (prodRows || []).map((p) => [String(p.id), p as { id: string; name: string; price: number; is_active: boolean }])
    );

    const itemsServidor = orderData.cartItems.map((item) => {
      const prod = prodById.get(String(item.productId));
      const precioReal = prod ? Number(prod.price) : NaN;
      if (!prod || !prod.is_active || !Number.isFinite(precioReal)) {
        throw new Error(
          "Uno de los productos de tu pedido ya no está disponible. Vuelve a la tienda y agrégalo de nuevo."
        );
      }
      const cantidad = Math.min(20, Math.max(1, Math.floor(Number(item.quantity) || 1)));
      return {
        ...item,
        name: prod.name || item.name,
        unitPrice: precioReal,
        quantity: cantidad,
      };
    });

    const subtotalServidor =
      Math.round(
        itemsServidor.reduce((suma, i) => suma + i.unitPrice * i.quantity, 0) * 100
      ) / 100;

    // Costo de envío real, según la zona del código postal (no lo que mande el cliente)
    const { data: zona } = await precioClient
      .from("delivery_zones")
      .select("delivery_cost, is_available")
      .eq("zip_code", orderData.deliveryZipCode)
      .eq("is_available", true)
      .maybeSingle();
    if (!zona) {
      throw new Error(
        "No tenemos cobertura de entrega en ese código postal. Verifica tu C.P. o escríbenos por WhatsApp."
      );
    }
    const envioServidor = Number(zona.delivery_cost) || 0;

    // La fecha de entrega también se valida en el servidor
    const { data: fechaBloqueada } = await precioClient
      .from("blocked_dates")
      .select("blocked_date")
      .eq("blocked_date", orderData.deliveryDate)
      .maybeSingle();
    if (fechaBloqueada) {
      throw new Error(
        "La fecha de entrega elegida ya no está disponible. Vuelve al producto y elige otra."
      );
    }

    if (orderData.cartItems.length > 30) {
      throw new Error("El pedido tiene demasiados artículos. Escríbenos por WhatsApp.");
    }

    // Descuento real del cupón, recalculado sobre el subtotal del servidor
    let descuentoServidor = 0;
    if (orderData.couponCode) {
      const { data: cupon } = await precioClient
        .from("discounts")
        .select("*")
        .eq("code", orderData.couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      const vigente =
        cupon &&
        (!cupon.expires_at || new Date(cupon.expires_at) >= new Date()) &&
        (!cupon.usage_limit || !cupon.used_count || cupon.used_count < cupon.usage_limit);

      if (vigente) {
        const bruto =
          cupon!.type === "percentage"
            ? (subtotalServidor * Number(cupon!.value)) / 100
            : Number(cupon!.value);
        descuentoServidor = Math.min(Math.max(bruto, 0), subtotalServidor);
      }
    }

    const totalServidor =
      Math.round((subtotalServidor - descuentoServidor + envioServidor) * 100) / 100;

    // Rastro si alguien intentó manipular el precio (no se usa su valor, solo se registra)
    const manipulacion =
      Math.abs(Number(orderData.subtotal) - subtotalServidor) > 0.01 ||
      Math.abs(Number(orderData.totalAmount) - totalServidor) > 0.01 ||
      Math.abs(Number(orderData.deliveryFee) - envioServidor) > 0.01;
    if (manipulacion) {
      console.warn("[Seguridad] Totales del cliente distintos a los del servidor", {
        enviado: {
          subtotal: orderData.subtotal,
          envio: orderData.deliveryFee,
          total: orderData.totalAmount,
        },
        calculado: {
          subtotal: subtotalServidor,
          envio: envioServidor,
          descuento: descuentoServidor,
          total: totalServidor,
        },
        orderId,
      });
    }

    // 2. Crear la preferencia de Mercado Pago ANTES de insertar (sin lecturas de BD)
    let preferenceId: string | null = null;
    let initPoint: string | null = null;
    let paymentWarning: string | null = null;

    try {
      // Items del pago = productos + envío - descuento, SIEMPRE con precios del servidor
      const paymentItems = itemsServidor.map((item) => ({
        title: item.name.slice(0, 255),
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }));

      if (envioServidor > 0) {
        paymentItems.push({
          title: "Costo de envío",
          quantity: 1,
          unit_price: Number(envioServidor.toFixed(2)),
        });
      }

      if (descuentoServidor > 0) {
        paymentItems.push({
          title: "Descuento aplicado",
          quantity: 1,
          unit_price: -Number(descuentoServidor.toFixed(2)),
        });
      }

      const pref = await createPaymentPreference({
        orderId,
        items: paymentItems,
        payerName: orderData.deliveryAddress.fullName,
        origin: origenConfiable,
      });
      preferenceId = pref.preferenceId;
      initPoint = pref.initPoint;
    } catch (prefError) {
      paymentWarning =
        prefError instanceof Error
          ? prefError.message
          : "No se pudo iniciar el pago. Contáctanos por WhatsApp.";
    }

    // 3. Insertar el pedido con SERVICE ROLE (solo servidor).
    //    Al no requerir permisos públicos, se puede tener RLS activo y cerrado.
    const insertClient = createAdminClient() ?? supabase;

    const insertPayload: Record<string, unknown> = {
      id: orderId,
      client_id: user?.id || null,
      status: "placed",
      total_amount: totalServidor,
      total_cost: orderData.totalCost,
      delivery_fee: envioServidor,
      delivery_date: orderData.deliveryDate,
      payment_method: "mercado_pago",
      payment_status: "pending",
      delivery_address: {
        ...orderData.deliveryAddress,
        zip_code: orderData.deliveryZipCode,
      },
      discount_id: discountId,
      is_offline_sale: false,
    };
    if (preferenceId) {
      insertPayload.payment_reference = preferenceId;
    }

    let orderError: { message: string; code?: string } | null = null;

    if (preferenceId) {
      const first = await insertClient.from("orders").insert(insertPayload);
      if (first.error && first.error.code === "42703" && insertPayload.payment_reference) {
        // La columna payment_reference no existe aún: reintentamos sin ella
        delete insertPayload.payment_reference;
        const retry = await insertClient.from("orders").insert(insertPayload);
        orderError = retry.error;
      } else {
        orderError = first.error;
      }
    } else {
      const res = await insertClient.from("orders").insert(insertPayload);
      orderError = res.error;
    }

    if (orderError) throw new Error(orderError.message);

    // 4. Costos reales por producto (raw_cost) para unit_cost y el costo total del pedido.
    //    Se leen con service role (dato interno, invisible para el cliente).
    const adminCostClient = createAdminClient() ?? supabase;
    const { data: costRows, error: costError } = await adminCostClient
      .from("products")
      .select("id, raw_cost")
      .in("id", productIds);

    if (costError) {
      console.warn("No se pudieron leer los costos de productos:", costError.message);
    }

    const costById = new Map<string, number>();
    (costRows || []).forEach((row) => {
      costById.set(String(row.id), Number(row.raw_cost) || 0);
    });

    let computedTotalCost = 0;
    const itemsToInsert = await Promise.all(
      itemsServidor.map(async (item, indice) => {
        // Si el producto existe en la BD usamos su raw_cost; si no, estimamos 40%
        const unitCost = costById.has(item.productId)
          ? costById.get(item.productId)!
          : Math.round(item.unitPrice * 0.4 * 100) / 100;
        computedTotalCost += unitCost * item.quantity;

        // Las fotos del cliente (taza y opciones con imagen) se suben al bucket
        // PRIVADO y en la base queda solo la ruta del archivo. Antes se guardaban
        // como texto base64 dentro del pedido: pesaba muchísimo y no se podían
        // descargar como archivo.
        const opciones = await subirImagenesDeOpciones(
          item.selectedOptions || {},
          orderId,
          indice
        );

        let fotoTaza: string | null = item.customCupImage || null;
        if (fotoTaza && fotoTaza.startsWith("data:image/")) {
          const ruta = await subirFotoPrivada(
            fotoTaza,
            `${orderId}/taza-${indice + 1}.jpg`
          );
          // Si la subida falla, dejamos el data URL como respaldo para no perder la foto
          fotoTaza = ruta || fotoTaza;
        }

        return {
          order_id: orderId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          unit_cost: unitCost,
          selected_options: opciones,
          custom_cup_image_url: fotoTaza,
        };
      })
    );

    const { error: itemsError } = await insertClient
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) throw new Error(itemsError.message);

    // 5. Actualizar el costo total del pedido con el cálculo real del servidor
    //    (usa service role si está configurada, porque los invitados no tienen permiso de UPDATE)
    if (computedTotalCost > 0) {
      const admin = createAdminClient();
      const costClient = admin ?? supabase;
      const { error: costUpdateError } = await costClient
        .from("orders")
        .update({ total_cost: computedTotalCost })
        .eq("id", orderId);

      if (costUpdateError) {
        console.warn("No se pudo actualizar total_cost:", costUpdateError.message);
      }
    }

    // 6. Notificación Pushover a las dueñas
    const pushoverUserKey = process.env.PUSHOVER_USER_KEY;
    const pushoverAppToken = process.env.PUSHOVER_APP_TOKEN;

    if (pushoverUserKey && pushoverAppToken) {
      try {
        await fetch("https://api.pushover.net/1/messages.json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: pushoverAppToken,
            user: pushoverUserKey,
            title: "🎉 ¡Nuevo Pedido en Momentiva!",
            message:
              `Entrega: ${orderData.deliveryAddress.fullName || "cliente"}` +
              (orderData.deliveryAddress.destinatario?.telefono
                ? ` (${orderData.deliveryAddress.destinatario.telefono})`
                : "") +
              `\nEnvía: ${orderData.deliveryAddress.remitente?.nombre || "—"}` +
              (orderData.deliveryAddress.remitente?.telefono
                ? ` (${orderData.deliveryAddress.remitente.telefono})`
                : "") +
              `\nTotal: $${totalServidor.toFixed(2)} MXN\nFecha: ${orderData.deliveryDate}` +
              (orderData.deliveryAddress.deliveryTime ? ` · ${orderData.deliveryAddress.deliveryTime}` : "") +
              `\nC.P.: ${orderData.deliveryZipCode}` +
              (orderData.deliveryAddress.esSorpresa ? "\n🎁 REGALO SORPRESA" : ""),
          }),
        });
      } catch (pErr) {
        console.error("Error sending Pushover notification:", pErr);
      }
    }

    revalidatePath("/admin/orders");
    return {
      success: true,
      orderId,
      initPoint,
      warning: paymentWarning ?? undefined,
    };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

// Confirmar pago de Mercado Pago: actualiza el pedido según el estado recibido.
// Usa service role si está configurada (para pedidos de invitados); si no, la sesión actual.
export async function confirmMercadoPagoPayment(paymentId: string) {
  try {
    const info = await getPaymentInfo(paymentId);
    if (!info) throw new Error("No se pudo consultar el pago en Mercado Pago.");

    // Registro de diagnóstico: motivo exacto del rechazo (visible en los logs del servidor)
    console.log(
      "[MercadoPago] pago recibido:",
      JSON.stringify({
        paymentId,
        status: info.status,
        statusDetail: info.statusDetail,
        paymentMethodId: info.paymentMethodId,
        externalReference: info.externalReference,
      })
    );

    if (!info.externalReference) {
      return { success: true, status: info.status, orderId: null };
    }

    // status: approved | pending | in_process | rejected | authorized
    const paymentStatus =
      info.status === "approved"
        ? "paid"
        : info.status === "rejected"
        ? "rejected"
        : "pending";

    const orderStatus =
      info.status === "approved" ? "work_in_progress" : "placed";

    const admin = createAdminClient();
    const supabase = admin ?? (await createClient());

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
      })
      .eq("id", info.externalReference);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/orders");
    revalidatePath("/mi-cuenta");
    return { success: true, status: info.status, orderId: info.externalReference };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

// Action to validate dynamic coupon code (tabla real: discounts)
// Se lee con SERVICE ROLE para poder cerrar la lectura pública de cupones
// (así nadie puede enumerar códigos desde el navegador).
export async function validateCoupon(code: string, subtotal: number) {
  // Un solo mensaje para todos los casos: así no se pueden enumerar cupones.
  const GENERICO = "Código de cupón inválido o expirado";

  const ip = ipDelVisitante(await headers());
  const limite = limitarIntentos(`cupon:${ip}`, 8, 60_000);
  if (!limite.permitido) {
    return { valid: false, error: limite.mensaje };
  }

  const supabase = createAdminClient() ?? (await createClient());

  const { data: coupon, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return { valid: false, error: GENERICO };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: GENERICO };
  }

  if (coupon.usage_limit && coupon.used_count && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, error: GENERICO };
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (subtotal * Number(coupon.value)) / 100;
  } else {
    discount = Number(coupon.value);
  }

  return { valid: true, discount: Math.min(discount, subtotal), code: coupon.code };
}
