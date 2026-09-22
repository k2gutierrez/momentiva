"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAtom, useSetAtom } from "jotai";
import { toast } from "sonner";
import { ShoppingCartIcon, SlidersHorizontalIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cartItemsAtom, type CartItem } from "@/store/cartStore";
import { entregaSeleccionadaAtom } from "@/store/complementosStore";
import { agregarComplemento } from "@/lib/complementosCliente";

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
  const [entrega] = useAtom(entregaSeleccionadaAtom);
  const [agregados, setAgregados] = useState<string[]>([]);

  const agregar = (comp: Complemento) => {
    if (!entrega.fecha || !entrega.hora) {
      toast.error("Primero elige la fecha y el horario de entrega del producto de arriba.");
      return;
    }
    setCart((prev: CartItem[]) => agregarComplemento(prev, comp, entrega));
    setAgregados((prev) => (prev.includes(comp.id) ? prev : [...prev, comp.id]));
    // A propósito NO se abre el carrito: así se pueden agregar 2 o 3 seguidos.
    toast.success(`${comp.name} agregado a tu pedido`);
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
            <div className="aspect-square bg-cream/70 flex items-center justify-center overflow-hidden p-2">
              {comp.images && comp.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comp.images[0]}
                  alt={comp.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
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
                  className={`mt-auto w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg transition-opacity ${
                    agregados.includes(comp.id)
                      ? "bg-sage/25 text-sage"
                      : "bg-terracota text-white hover:opacity-90"
                  }`}
                >
                  {agregados.includes(comp.id) ? (
                    <>
                      <CheckIcon size={16} weight="bold" /> Agregado
                    </>
                  ) : (
                    <>
                      <ShoppingCartIcon size={16} weight="bold" /> Agregar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
