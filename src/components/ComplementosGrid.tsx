"use client";

import React from "react";
import Link from "next/link";
import { useAtom, useSetAtom } from "jotai";
import { toast } from "sonner";
import { ShoppingCartIcon, SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr";
import { cartItemsAtom, cartOpenAtom, type CartItem } from "@/store/cartStore";
import { entregaSeleccionadaAtom } from "@/store/complementosStore";

export interface Complemento {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
  custom_options?: unknown;
}

/**
 * Cuadrícula de complementos dentro de la ficha del producto.
 *
 * Al agregar un complemento se le pone LA MISMA fecha y hora de entrega que el
 * producto principal (se eligen arriba, en el formulario). Así el checkout no
 * pide una fecha aparte para el complemento.
 */
export default function ComplementosGrid({ complementos }: { complementos: Complemento[] }) {
  const setCart = useSetAtom(cartItemsAtom);
  const setCartOpen = useSetAtom(cartOpenAtom);
  const [entrega] = useAtom(entregaSeleccionadaAtom);

  const agregar = (comp: Complemento) => {
    if (!entrega.fecha || !entrega.hora) {
      toast.error(
        "Primero elige la fecha y el horario de entrega del producto de arriba."
      );
      document
        .getElementById("complementa-tu-regalo")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setCart((prev: CartItem[]) => {
      const firma = {
        selections: {},
        deliveryDate: entrega.fecha,
        deliveryTime: entrega.hora,
      };
      const existente = prev.find(
        (item) =>
          item.productId === comp.id &&
          JSON.stringify({
            selections: item.selectedOptions || {},
            deliveryDate: item.deliveryDate,
            deliveryTime: item.deliveryTime,
          }) === JSON.stringify(firma)
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
          // Hereda la entrega del producto principal
          deliveryDate: entrega.fecha,
          deliveryTime: entrega.hora,
        },
      ];
    });

    toast.success(`${comp.name} agregado a tu pedido`);
    setCartOpen(true);
  };

  if (complementos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mt-12">
      {complementos.map((comp) => {
        const opciones = Array.isArray(comp.custom_options) ? comp.custom_options : [];
        const necesitaOpciones = opciones.length > 0;

        return (
          <div
            key={comp.id}
            className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="aspect-square bg-cream overflow-hidden">
              {comp.images && comp.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comp.images[0]}
                  alt={comp.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sage text-xs font-bold bg-lilaPastel/30">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="p-4 text-center flex flex-col flex-1">
              <h4 className="text-sm font-bold text-[#3A243F] leading-tight">
                {comp.name}
              </h4>
              <p className="text-terracota font-bold mt-2 mb-3">
                ${Number(comp.price).toFixed(2)}
              </p>

              {necesitaOpciones ? (
                <Link
                  href={`/product/${comp.slug}`}
                  className="mt-auto w-full flex items-center justify-center gap-2 bg-[#F5EFF6] text-[#3A243F] text-xs font-bold py-2.5 rounded-lg hover:bg-terracota hover:text-white transition-colors"
                >
                  <SlidersHorizontalIcon size={16} weight="bold" /> Elegir opciones
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => agregar(comp)}
                  className="mt-auto w-full flex items-center justify-center gap-2 bg-terracota text-white text-xs font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <ShoppingCartIcon size={16} weight="bold" /> Agregar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
