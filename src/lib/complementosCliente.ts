"use client";

import { createClient } from "@/lib/supabase/client";
import { esCategoriaComplementos } from "@/lib/complementos";
import type { CartItem } from "@/store/cartStore";

export type ComplementoSugerido = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
  custom_options?: unknown;
  description?: string | null;
  is_custom_cup?: boolean | null;
};

/** La taza personalizada necesita su configurador (subir foto y ajustar). */
export function esTazaPersonalizada(c: { name?: string | null; is_custom_cup?: boolean | null }) {
  return Boolean(c.is_custom_cup) && /taza/i.test(String(c.name || ""));
}

/**
 * Trae los productos de la categoría "Complementa tu regalo".
 *
 * Se usa DENTRO del carrito, para ofrecer complementos ahí mismo: así la clienta
 * no tiene que cerrar el carrito, volver al producto y empezar de nuevo (que era
 * justo lo que pasaba).
 */
export async function traerComplementos(): Promise<ComplementoSugerido[]> {
  try {
    const supabase = createClient();

    const { data: categorias } = await supabase.from("categories").select("id, name, slug");
    const ids = new Set(
      (categorias || [])
        .filter((c) => esCategoriaComplementos(c.slug, c.name))
        .map((c) => c.id)
    );
    if (ids.size === 0) return [];

    // Solo columnas públicas: el costo interno (raw_cost) no es legible desde aquí.
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, images, custom_options, category_id, is_active, description, is_custom_cup")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return (data || [])
      .filter((p) => p.category_id && ids.has(p.category_id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        images: Array.isArray(p.images) ? (p.images as string[]) : null,
        custom_options: p.custom_options,
        description: p.description ?? null,
        is_custom_cup: p.is_custom_cup ?? null,
      }));
  } catch {
    return [];
  }
}

/**
 * Agrega un complemento al carrito con LA MISMA fecha y hora de entrega del
 * producto principal. Si ya existe uno igual (mismo producto y misma entrega), en
 * vez de duplicar la línea se le suma cantidad.
 */
export function agregarComplemento(
  prev: CartItem[],
  comp: ComplementoSugerido,
  entrega: { fecha: string; hora: string }
): CartItem[] {
  const firma = JSON.stringify({
    selections: {},
    deliveryDate: entrega.fecha,
    deliveryTime: entrega.hora,
  });

  const existente = prev.find(
    (item) =>
      item.productId === comp.id &&
      JSON.stringify({
        selections: item.selectedOptions || {},
        deliveryDate: item.deliveryDate,
        deliveryTime: item.deliveryTime,
      }) === firma
  );

  if (existente) {
    return prev.map((item) =>
      item.cartItemId === existente.cartItemId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }

  return [
    ...prev,
    {
      cartItemId: `${comp.id}-${Date.now()}`,
      productId: comp.id,
      name: comp.name,
      unitPrice: Number(comp.price),
      quantity: 1,
      image: comp.images?.[0] || "/placeholder.png",
      slug: comp.slug,
      selectedOptions: {},
      deliveryDate: entrega.fecha,
      deliveryTime: entrega.hora,
    },
  ];
}
