"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { UploadSimpleIcon, ShoppingCartIcon } from "@phosphor-icons/react/dist/ssr";
import { useSetAtom } from "jotai";
import { cartItemsAtom, cartOpenAtom, type CartItem } from "@/store/cartStore";
import { entregaSeleccionadaAtom } from "@/store/complementosStore";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { comprimirImagen } from "@/lib/imagen";
import type { AjusteTaza } from "./CupCanvas";

// Deshabilitamos SSR para evitar errores con Konva en Next.js
const CupCanvas = dynamic(() => import("./CupCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#F5EFF6] animate-pulse rounded-2xl flex items-center justify-center text-[#3A243F] font-bold">
      Cargando visualizador...
    </div>
  ),
});

// Producto real de la taza: se administra en el panel, ahí se cambia el precio.
export interface ProductoTaza {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
}

export default function CupPreviewer({ producto }: { producto: ProductoTaza }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  // Vista compuesta: cómo queda la foto dentro de la taza. Se genera sola cada
  // vez que el cliente mueve, escala o gira la imagen.
  const [vista, setVista] = useState<{ dataUrl: string; ajuste: AjusteTaza } | null>(null);

  const setCart = useSetAtom(cartItemsAtom);
  const setCartOpen = useSetAtom(cartOpenAtom);
  // La taza hereda la fecha y hora del producto principal
  const entrega = useAtomValue(entregaSeleccionadaAtom);

  const handleSnapshot = useCallback(
    (dataUrl: string, ajuste: AjusteTaza) => setVista({ dataUrl, ajuste }),
    []
  );

  const handleAddCupToCart = () => {
    if (!imageSrc) {
      toast.error("Por favor sube una imagen primero");
      return;
    }

    if (!entrega.fecha || !entrega.hora) {
      toast.error(
        "Primero elige la fecha y el horario de entrega del producto de arriba."
      );
      return;
    }

    // El diseño va en las opciones del artículo: el servidor sube la vista
    // compuesta al bucket privado igual que la foto original.
    const opciones: Record<string, string | string[]> = {};
    if (vista) {
      opciones["Diseño de taza"] = [vista.dataUrl];
      opciones["Ajuste de la foto"] =
        `posición ${vista.ajuste.x},${vista.ajuste.y} · escala ${Math.round(vista.ajuste.escala * 100)}% · rotación ${vista.ajuste.rotacion}°`;
    }

    setCart((prev: CartItem[]) => [
      ...prev,
      {
        cartItemId: `cup-${Date.now()}`,
        productId: producto.id,
        name: producto.name,
        unitPrice: producto.price,
        quantity: 1,
        image: imageSrc,
        slug: producto.slug,
        // La foto viaja con el pedido; al confirmar la compra se sube al bucket privado
        customCupImage: imageSrc,
        selectedOptions: opciones,
        // Misma entrega que el producto principal (así el checkout no pide fecha aparte)
        deliveryDate: entrega.fecha,
        deliveryTime: entrega.hora,
      },
    ]);

    toast.success(
      vista
        ? "Taza añadida a tu pedido con su diseño"
        : "Taza añadida a tu pedido"
    );
    setCartOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("La imagen pesa más de 15 MB. Elige una más ligera.");
      return;
    }
    try {
      setProcesando(true);
      setVista(null); // se recalcula con la nueva foto
      // Antes se usaba URL.createObjectURL: esa liga solo existía en ese navegador
      // y la foto nunca se guardaba. Ahora se comprime y viaja en el carrito.
      const comprimida = await comprimirImagen(file);
      setImageSrc(comprimida);
    } catch {
      toast.error("No se pudo procesar la imagen");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-6 md:p-10 max-w-6xl mx-auto items-center lg:items-start bg-white rounded-3xl shadow-sm">
      {/* Columna Izquierda: El Canvas con Responsive Scaling */}
      <div className="w-full lg:w-1/2 flex justify-center overflow-hidden">
        {/* Escalamos el canvas (500x500) con un contenedor de altura proporcional */}
        <div className="w-[325px] h-[325px] sm:w-[375px] sm:h-[375px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px] overflow-hidden mx-auto">
          <div className="scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 origin-top-left">
            <CupCanvas uploadedImageSrc={imageSrc} onSnapshot={handleSnapshot} />
          </div>
        </div>
      </div>

      {/* Columna Derecha: Controles */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6 pt-0 lg:pt-8">
        <div>
          <span className="text-sm font-bold text-sage uppercase tracking-widest block mb-2">
            Complemento Especial
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#3A243F] mb-3">
            {producto.name}
          </h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Sube tu foto favorita y ajusta el diseño. La imprimiremos y la agregaremos
            dentro o junto a tu arreglo de globos para hacer tu regalo aún más inolvidable.
          </p>
        </div>

        {/* Botón de Subida */}
        <label className="flex items-center justify-center gap-2 bg-[#F5EFF6] hover:bg-[#EBE0EC] text-[#3A243F] px-6 py-4 rounded-xl cursor-pointer transition-colors shadow-sm w-full md:w-auto">
          <UploadSimpleIcon size={24} weight="bold" className="text-terracota" />
          <span className="font-bold">
            {procesando ? "Procesando…" : imageSrc ? "Cambiar mi Imagen" : "Subir mi Imagen"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>

        {imageSrc && (
          <p className="text-xs font-bold text-sage -mt-2">
            ✓ Foto cargada. Ajusta el tamaño y la posición dentro de la taza: el
            diseño final se guarda solo con tu pedido.
          </p>
        )}

        {/* Instrucciones */}
        <div className="bg-cream/50 p-5 rounded-xl">
          <h3 className="font-bold text-[#3A243F] mb-2 text-sm">¿Cómo funciona?</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5">
            <li>Sube tu imagen (PNG o JPG).</li>
            <li>Haz clic sobre tu imagen en la taza.</li>
            <li>
              Arrastra para moverla, usa las esquinas para hacerla más grande o pequeña
              y el círculo superior para rotarla.
            </li>
          </ul>
        </div>

        {/* Agregar al Carrito (Complemento) */}
        <div className="mt-4 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-sm font-bold text-gray-400">Precio del complemento</span>
            <span className="text-3xl font-bold text-terracota">
              ${producto.price.toFixed(2)}{" "}
              <span className="text-sm font-normal text-gray-500">MXN</span>
            </span>
          </div>
          <button
            onClick={handleAddCupToCart}
            disabled={procesando}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#3A243F] hover:bg-opacity-90 disabled:opacity-50 text-white px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg font-bold"
          >
            <ShoppingCartIcon size={20} weight="bold" />
            Añadir a mi pedido
          </button>
        </div>
      </div>
    </div>
  );
}
