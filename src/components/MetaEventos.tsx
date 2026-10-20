"use client";

import { useEffect } from "react";
import { metaTrack, montoMeta } from "@/lib/metaPixel";

/** Producto visto (ficha del producto). */
export function MetaViewContent({
  producto,
}: {
  producto: { id: string; nombre: string; precio: number; categoria?: string };
}) {
  useEffect(() => {
    metaTrack("ViewContent", {
      content_ids: [producto.id],
      content_name: producto.nombre,
      content_type: "product",
      content_category: producto.categoria || undefined,
      value: montoMeta(producto.precio),
      currency: "MXN",
    });
  }, [producto.id, producto.nombre, producto.precio, producto.categoria]);

  return null;
}

/** La clienta empezó el proceso de compra (pantalla de pago). */
export function MetaInitiateCheckout({
  articulos,
  valor,
}: {
  articulos: { id: string; cantidad: number; precio: number }[];
  valor: number;
}) {
  useEffect(() => {
    if (!articulos.length) return;
    metaTrack("InitiateCheckout", {
      content_ids: articulos.map((a) => a.id),
      contents: articulos.map((a) => ({
        id: a.id,
        quantity: a.cantidad,
        item_price: montoMeta(a.precio),
      })),
      content_type: "product",
      num_items: articulos.reduce((s, a) => s + a.cantidad, 0),
      value: montoMeta(valor),
      currency: "MXN",
    });
    // Se registra al abrir la pantalla de pago, una vez por visita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * Compra confirmada.
 *
 * Se registra UNA sola vez por pedido: si la clienta recarga la pantalla de éxito o
 * vuelve a entrar al enlace, no se cuenta la compra dos veces (se guarda el folio en el
 * navegador y además se manda el mismo identificador de evento a Meta).
 */
export function MetaPurchase({
  folio,
  valor,
  articulos,
}: {
  folio: string;
  valor: number;
  articulos: { id: string; cantidad: number; precio: number }[];
}) {
  useEffect(() => {
    if (!folio || !valor) return;
    const clave = `meta_purchase_${folio}`;
    try {
      if (window.localStorage.getItem(clave)) return;
    } catch {
      /* si el navegador bloquea localStorage, se registra de todas formas */
    }

    metaTrack(
      "Purchase",
      {
        content_ids: articulos.map((a) => a.id),
        contents: articulos.map((a) => ({
          id: a.id,
          quantity: a.cantidad,
          item_price: montoMeta(a.precio),
        })),
        content_type: "product",
        num_items: articulos.reduce((s, a) => s + a.cantidad, 0),
        value: montoMeta(valor),
        currency: "MXN",
      },
      folio
    );

    try {
      window.localStorage.setItem(clave, "1");
    } catch {
      /* ignorar */
    }
  }, [folio, valor, articulos]);

  return null;
}
