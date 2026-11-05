"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// Update order status: placed -> work_in_progress -> finish -> delivered
export async function updateOrderStatus(orderId: string, status: 'placed' | 'work_in_progress' | 'finish' | 'delivered') {
  // Autorización en el servidor: el proxy de /admin NO protege las actions
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// VENTAS EXTERNAS (offline)
//
// Antes solo se guardaba un monto suelto: no había producto, ni artículos,
// ni descuento de inventario. Ahora la venta se registra como un pedido
// normal con sus `order_items`, para que el panel muestre qué se vendió y
// para que el inventario y el margen queden correctos.
//
// La escritura se hace en el servidor con la llave de servicio (igual que el
// checkout): así `orders` sigue cerrada a INSERT desde el navegador y no hace
// falta abrir una política RLS. La autorización ya la valida `requireAdmin()`.
// ─────────────────────────────────────────────────────────────

interface OfflineSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface OfflineSaleInput {
  customerName: string;
  deliveryDate: string;
  notes?: string;
  items: OfflineSaleItemInput[];
}

interface ProductoVenta {
  id: string;
  name: string;
  price: number;
  raw_cost: number | null;
  is_active: boolean;
  is_in_stock_item: boolean | null;
  stock_quantity: number | null;
}

interface LineaVenta {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  isStockItem: boolean;
  disponible: number;
}

interface AjusteStock {
  id: string;
  anterior: number;
  nuevo: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createOfflineSale(input: OfflineSaleInput) {
  // Autorización en el servidor: el proxy de /admin NO protege las actions
  await requireAdmin();

  const admin = createAdminClient();
  if (!admin) {
    return {
      success: false,
      error: "El servidor no tiene configurada la llave de servicio (SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  try {
    // 1) DATOS GENERALES
    const customerName = String(input?.customerName || "").trim();
    if (customerName.length < 2 || customerName.length > 120) {
      throw new Error("Escribe el nombre del cliente (entre 2 y 120 caracteres).");
    }

    const deliveryDate = String(input?.deliveryDate || "").trim();
    const partesFecha = deliveryDate.split("-").map(Number);
    const fecha = new Date(Date.UTC(partesFecha[0], partesFecha[1] - 1, partesFecha[2]));
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) ||
      Number.isNaN(fecha.getTime()) ||
      fecha.getUTCFullYear() !== partesFecha[0] ||
      fecha.getUTCMonth() !== partesFecha[1] - 1 ||
      fecha.getUTCDate() !== partesFecha[2]
    ) {
      throw new Error("La fecha de entrega no es válida.");
    }

    const notes = typeof input?.notes === "string" ? input.notes.trim().slice(0, 500) : "";

    // 2) LÍNEAS DE PRODUCTO
    //    Del navegador solo se toman id, cantidad y precio; el nombre y el costo
    //    interno se leen de la base para que no se puedan falsificar.
    const items = Array.isArray(input?.items) ? input.items : [];
    if (items.length === 0) throw new Error("Agrega al menos un producto a la venta.");
    if (items.length > 30) throw new Error("La venta tiene demasiados productos.");

    const limpios = items.map((item) => {
      const productId = String(item?.productId || "");
      const quantity = Math.floor(Number(item?.quantity));
      const unitPrice = Math.round((Number(item?.unitPrice) || 0) * 100) / 100;

      if (!productId) throw new Error("Falta elegir un producto en una de las líneas.");
      if (!UUID_RE.test(productId)) {
        throw new Error("Uno de los productos no es válido. Vuelve a cargar la lista.");
      }
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
        throw new Error("Cada producto debe llevar una cantidad entre 1 y 20.");
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 1_000_000) {
        throw new Error("El precio de un producto no es válido.");
      }

      return { productId, quantity, unitPrice };
    });

    if (new Set(limpios.map((i) => i.productId)).size !== limpios.length) {
      throw new Error(
        "Hay un producto repetido. Cambia la cantidad en su línea en vez de agregarlo dos veces."
      );
    }

    // 3) PRODUCTOS REALES (precio, costo interno e inventario)
    const { data: productos, error: productosError } = await admin
      .from("products")
      .select("id, name, price, raw_cost, is_active, is_in_stock_item, stock_quantity")
      .in("id", limpios.map((i) => i.productId));

    if (productosError) throw new Error(productosError.message);

    const porId = new Map<string, ProductoVenta>(
      ((productos || []) as ProductoVenta[]).map((p) => [String(p.id), p])
    );

    const lineas: LineaVenta[] = limpios.map((item) => {
      const producto = porId.get(item.productId);
      if (!producto) throw new Error("Uno de los productos ya no existe. Vuelve a cargar la lista.");
      if (!producto.is_active) {
        throw new Error(`«${producto.name}» está apagado. Actívalo o quítalo de la venta.`);
      }

      const disponible = Math.max(0, Math.floor(Number(producto.stock_quantity) || 0));
      if (producto.is_in_stock_item && item.quantity > disponible) {
        throw new Error(
          `De «${producto.name}» solo ${
            disponible === 1 ? "queda 1 pieza" : `quedan ${disponible} piezas`
          }.`
        );
      }

      return {
        productId: item.productId,
        name: String(producto.name || "Producto"),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: Math.round((Number(producto.raw_cost) || 0) * 100) / 100,
        isStockItem: Boolean(producto.is_in_stock_item),
        disponible,
      };
    });

    const totalAmount =
      Math.round(lineas.reduce((suma, l) => suma + l.unitPrice * l.quantity, 0) * 100) / 100;
    const totalCost =
      Math.round(lineas.reduce((suma, l) => suma + l.unitCost * l.quantity, 0) * 100) / 100;

    if (totalAmount <= 0) throw new Error("El total de la venta debe ser mayor a cero.");

    // 4) GUARDAR PEDIDO + ARTÍCULOS + INVENTARIO
    const orderId = randomUUID();
    const ajustes: AjusteStock[] = [];

    // Si algo falla a medio camino, se deshace lo escrito para no dejar
    // pedidos incompletos ni inventario descontado a medias.
    const deshacer = async () => {
      for (const ajuste of ajustes) {
        await admin
          .from("products")
          .update({ stock_quantity: ajuste.anterior })
          .eq("id", ajuste.id)
          .eq("stock_quantity", ajuste.nuevo);
      }
      await admin.from("order_items").delete().eq("order_id", orderId);
      await admin.from("orders").delete().eq("id", orderId);
    };

    const { error: ordenError } = await admin.from("orders").insert({
      id: orderId,
      client_id: null,
      is_offline_sale: true,
      status: "delivered",
      total_amount: totalAmount,
      total_cost: totalCost,
      delivery_fee: 0,
      delivery_date: deliveryDate,
      payment_method: "offline",
      payment_status: "paid",
      delivery_address: {
        customer_name: customerName,
        fullName: customerName,
        notes: notes || "Venta externa registrada manualmente",
      },
    });

    if (ordenError) throw new Error(`No se pudo guardar la venta: ${ordenError.message}`);

    const { error: itemsError } = await admin.from("order_items").insert(
      lineas.map((linea) => ({
        order_id: orderId,
        product_id: linea.productId,
        quantity: linea.quantity,
        unit_price: linea.unitPrice,
        unit_cost: linea.unitCost,
        selected_options: {},
        custom_cup_image_url: null,
      }))
    );

    if (itemsError) {
      await deshacer();
      throw new Error(`No se pudieron guardar los productos de la venta: ${itemsError.message}`);
    }

    for (const linea of lineas) {
      if (!linea.isStockItem) continue;

      const nuevo = Math.max(0, linea.disponible - linea.quantity);
      const { data: actualizado, error: stockError } = await admin
        .from("products")
        .update({ stock_quantity: nuevo })
        .eq("id", linea.productId)
        // Solo si nadie más cambió el inventario desde que lo leímos
        .eq("stock_quantity", linea.disponible)
        .select("id");

      if (stockError || !actualizado || actualizado.length === 0) {
        await deshacer();
        throw new Error(
          `No se pudo descontar el inventario de «${linea.name}». No se guardó la venta; inténtalo de nuevo.`
        );
      }

      ajustes.push({ id: linea.productId, anterior: linea.disponible, nuevo });
    }

    revalidatePath("/admin/orders");
    return { success: true, orderId };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}
