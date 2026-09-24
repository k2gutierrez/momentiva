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
  ArrowLeftIcon,
  SparkleIcon,
  SlidersHorizontalIcon,
  CircleNotchIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cartItemsAtom, cartOpenAtom, type CartItem } from "@/store/cartStore";
import { complementosModalAbiertoAtom, entregaSeleccionadaAtom } from "@/store/complementosStore";
import {
  traerComplementos,
  agregarComplemento,
  type ComplementoSugerido,
} from "@/lib/complementosCliente";
import { esTazaPersonalizada } from "@/lib/complementos";
import CupPreviewer from "@/components/CupPreviewer";
import Image from "next/image";

/**
 * Modal de complementos (estilo enviaflores).
 *
 * Flujo: al agregar al carrito un producto que acepta complementos se abre este
 * modal con la LISTA. Al elegir uno, el mismo modal cambia a su DETALLE (con su
 * información y, si es la taza, su personalizador completo). Al agregarlo, vuelve a
 * la lista sin el que ya se agregó. Siempre se puede ir al carrito o seguir
 * comprando.
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
  const [seleccionado, setSeleccionado] = useState<ComplementoSugerido | null>(null);

  // Al abrir, se cargan los complementos y se vuelve a la lista
  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    setCargando(true);
    setSeleccionado(null);
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
  const irAlCarrito = () => {
    setAbierto(false);
    setCarritoAbierto(true);
  };
  const seguirComprando = () => {
    setAbierto(false);
    router.push("/");
  };

  /** Marca el complemento como agregado y regresa a la lista. */
  const despuesDeAgregar = (comp: ComplementoSugerido, mensaje?: string) => {
    setAgregados((prev) => (prev.includes(comp.id) ? prev : [...prev, comp.id]));
    setSeleccionado(null);
    if (mensaje) toast.success(mensaje);
  };

  const agregarSimple = (comp: ComplementoSugerido) => {
    if (!entrega.fecha || !entrega.hora) {
      toast.error("Primero elige la fecha y el horario de entrega.");
      return;
    }
    setCarrito((prev: CartItem[]) => agregarComplemento(prev, comp, entrega));
    despuesDeAgregar(comp, `${comp.name} agregado a tu pedido`);
  };

  const disponibles = complementos.filter((c) => !agregados.includes(c.id));

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-[#3A243F]/50 backdrop-blur-sm" onClick={cerrar} />

      <div className="relative w-full sm:max-w-2xl max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-fade-in-up">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-lilaPastel">
          <div className="min-w-0">
            {seleccionado ? (
              <button
                onClick={() => setSeleccionado(null)}
                className="flex items-center gap-1.5 text-sm font-bold text-terracota hover:underline mb-2"
              >
                <ArrowLeftIcon size={16} weight="bold" /> Volver a los complementos
              </button>
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold text-[#3A243F] flex items-center gap-2">
                <SparkleIcon size={22} weight="fill" className="text-terracota" />
                ¿Quieres agregar algo más?
              </h2>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {seleccionado
                ? seleccionado.name
                : "Suma detalles a tu regalo. Puedes elegir los que quieras."}
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
          {seleccionado ? (
            /* ── DETALLE del complemento elegido ── */
            esTazaPersonalizada(seleccionado) ? (
              /* La taza: personalizador completo dentro del modal */
              <div className="-mx-5 sm:mx-0">
                <CupPreviewer
                  producto={{
                    id: seleccionado.id,
                    name: seleccionado.name,
                    slug: seleccionado.slug,
                    price: Number(seleccionado.price),
                    image: seleccionado.images?.[0] || null,
                  }}
                  onAgregado={() =>
                    despuesDeAgregar(seleccionado, "Taza añadida a tu pedido con su diseño")
                  }
                />
              </div>
            ) : (
              /* Complemento normal: su información y agregar */
              <div className="max-w-md mx-auto text-center">
                <div className="relative aspect-square bg-cream rounded-2xl overflow-hidden mb-4">
                  {seleccionado.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                      src={seleccionado.images[0]}
                      alt={seleccionado.name}
                      fill
                      sizes="(max-width: 768px) 90vw, 420px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xs text-sage font-bold">Sin imagen</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-[#3A243F]">{seleccionado.name}</h3>
                <p className="text-2xl font-bold text-terracota mt-1">
                  ${Number(seleccionado.price).toFixed(2)}
                </p>
                {seleccionado.description && (
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    {seleccionado.description}
                  </p>
                )}

                {Array.isArray(seleccionado.custom_options) &&
                seleccionado.custom_options.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      cerrar();
                      router.push(`/product/${seleccionado.slug}`);
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-[#F5EFF6] text-[#3A243F] font-bold py-4 rounded-xl hover:bg-terracota hover:text-white transition-colors"
                  >
                    <SlidersHorizontalIcon size={20} weight="bold" /> Elegir sus opciones
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => agregarSimple(seleccionado)}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-terracota text-white font-bold py-4 rounded-xl shadow-md hover:opacity-90 transition-opacity"
                  >
                    <PlusCircleIcon size={20} weight="bold" /> Agregar al carrito
                  </button>
                )}
              </div>
            )
          ) : cargando ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 py-12">
              <CircleNotchIcon size={20} className="animate-spin text-terracota" />
              Cargando complementos…
            </div>
          ) : disponibles.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircleIcon size={44} weight="fill" className="text-sage mx-auto mb-3" />
              <p className="font-bold text-[#3A243F]">
                {agregados.length > 0
                  ? "¡Listo! Ya agregaste lo que querías"
                  : "No hay complementos disponibles"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {agregados.length > 0
                  ? "Puedes ir al carrito o seguir comprando."
                  : "Vuelve pronto: pronto tendremos más detalles."}
              </p>
            </div>
          ) : (
            /* ── LISTA de complementos ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {disponibles.map((comp) => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSeleccionado(comp)}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                >
                  <div className="relative aspect-square bg-cream overflow-hidden">
                    {comp.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <Image
                        src={comp.images[0]}
                        alt={comp.name}
                        fill
                        sizes="(max-width: 768px) 45vw, 200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
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
                    <span className="mt-2 w-full flex items-center justify-center gap-1.5 bg-terracota text-white text-xs font-bold py-2 rounded-lg">
                      {esTazaPersonalizada(comp) ? (
                        <>
                          <SlidersHorizontalIcon size={14} weight="bold" /> Personalizar
                        </>
                      ) : (
                        <>
                          <PlusCircleIcon size={14} weight="bold" /> Ver y agregar
                        </>
                      )}
                    </span>
                  </div>
                </button>
              ))}
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
