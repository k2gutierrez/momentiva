"use client";

import React, { useEffect, useState } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  XIcon,
  PlusCircleIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  SparkleIcon,
  SlidersHorizontalIcon,
  CircleNotchIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cartItemsAtom, cartOpenAtom, type CartItem } from "@/store/cartStore";
import { complementosModalAbiertoAtom, entregaSeleccionadaAtom } from "@/store/complementosStore";
import { traerComplementos, agregarComplemento, type ComplementoSugerido } from "@/lib/complementosCliente";

/**
 * Modal de complementos (estilo enviaflores).
 *
 * Se abre al agregar al carrito un producto que acepta complementos: ahí mismo se
 * ofrecen, se agregan y se puede seguir con otro. Al terminar, la clienta decide
 * entre ir al carrito o seguir comprando.
 */
export default function ComplementosModal() {
  const [abierto, setAbierto] = useAtom(complementosModalAbiertoAtom);
  const setCarrito = useSetAtom(cartItemsAtom);
  const setCarritoAbierto = useSetAtom(cartOpenAtom);
  const entrega = useAtomValue(entregaSeleccionadaAtom);
  const router = useRouter();

  const [complementos, setComplementos] = useState<ComplementoSugerido[]>([]);
  const [agregados, setAgregados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);

  // Al abrir, se cargan los complementos disponibles
  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    setCargando(true);
    traerComplementos()
      .then((lista) => {
        if (!vivo) return;
        setComplementos(lista);
        setAgregados([]);
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [abierto]);

  if (!abierto) return null;

  const cerrar = () => setAbierto(false);

  const agregar = (comp: ComplementoSugerido) => {
    if (!entrega.fecha || !entrega.hora) {
      toast.error("Primero elige la fecha y el horario de entrega.");
      return;
    }
    setCarrito((prev: CartItem[]) => agregarComplemento(prev, comp, entrega));
    setAgregados((prev) => [...prev, comp.id]);
    toast.success(`${comp.name} agregado a tu pedido`);
  };

  const irAlCarrito = () => {
    setAbierto(false);
    setCarritoAbierto(true);
  };

  const seguirComprando = () => {
    setAbierto(false);
    router.push("/");
  };

  const disponibles = complementos.filter((c) => !agregados.includes(c.id));

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
      {/* Fondo */}
      <div className="absolute inset-0 bg-[#3A243F]/50 backdrop-blur-sm" onClick={cerrar} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-fade-in-up">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-lilaPastel">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3A243F] flex items-center gap-2">
              <SparkleIcon size={22} weight="fill" className="text-terracota" />
              ¿Quieres agregar algo más?
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Suma detalles a tu regalo. Puedes elegir los que quieras.
            </p>
          </div>
          <button
            onClick={cerrar}
            className="p-2 rounded-full hover:bg-cream transition-colors text-gray-500 shrink-0"
            aria-label="Cerrar"
          >
            <XIcon size={20} weight="bold" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {cargando ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 py-12">
              <CircleNotchIcon size={20} className="animate-spin text-terracota" />
              Cargando complementos…
            </div>
          ) : disponibles.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircleIcon size={44} weight="fill" className="text-sage mx-auto mb-3" />
              <p className="font-bold text-[#3A243F]">
                {agregados.length > 0 ? "¡Listo! Ya agregaste lo que querías" : "No hay complementos disponibles"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {agregados.length > 0
                  ? "Puedes ir al carrito o seguir comprando."
                  : "Vuelve pronto: pronto tendremos más detalles."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {disponibles.map((comp) => {
                const necesitaOpciones =
                  Array.isArray(comp.custom_options) && comp.custom_options.length > 0;

                return (
                  <div
                    key={comp.id}
                    className="flex flex-col rounded-2xl border border-lilaPastel/70 overflow-hidden bg-white shadow-sm"
                  >
                    <div className="aspect-square bg-cream/70 flex items-center justify-center p-2">
                      {comp.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={comp.images[0]}
                          alt={comp.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-sage font-bold">Sin imagen</span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1 text-center">
                      <p className="text-xs font-bold text-[#3A243F] leading-tight flex-1">
                        {comp.name}
                      </p>
                      <p className="text-terracota font-bold text-sm mt-1">
                        ${Number(comp.price).toFixed(2)}
                      </p>

                      {necesitaOpciones ? (
                        <button
                          type="button"
                          onClick={() => {
                            cerrar();
                            router.push(`/product/${comp.slug}`);
                          }}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 bg-[#F5EFF6] text-[#3A243F] text-xs font-bold py-2 rounded-lg hover:bg-terracota hover:text-white transition-colors"
                        >
                          <SlidersHorizontalIcon size={14} weight="bold" /> Personalizar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => agregar(comp)}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 bg-terracota text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          <PlusCircleIcon size={14} weight="bold" /> Agregar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie: qué hacer al terminar */}
        <div className="p-5 sm:p-6 border-t border-lilaPastel bg-white rounded-b-3xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={irAlCarrito}
              className="flex-1 flex items-center justify-center gap-2 bg-terracota hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-md transition-opacity"
            >
              <ShoppingCartIcon size={20} weight="bold" /> Ir al carrito
              {agregados.length > 0 && (
                <span className="bg-white/25 rounded-full px-2 py-0.5 text-xs">
                  +{agregados.length}
                </span>
              )}
            </button>
            <button
              onClick={seguirComprando}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-berenjena font-bold py-4 rounded-xl border border-lilaPastel hover:bg-cream transition-colors"
            >
              Seguir comprando <ArrowRightIcon size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
