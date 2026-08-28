"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { UploadSimpleIcon, ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr';
import { useSetAtom } from "jotai";
import { cartItemsAtom, cartOpenAtom } from "@/store/cartStore";
import { toast } from "sonner";

// Deshabilitamos SSR para evitar errores con Konva en Next.js
const CupCanvas = dynamic(() => import('./CupCanvas'), { 
  ssr: false,
  loading: () => (
    <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#F5EFF6] animate-pulse rounded-2xl flex items-center justify-center text-[#3A243F] font-bold border border-lilaPastel">
      Cargando visualizador...
    </div>
  )
});

export default function CupPreviewer() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const setCart = useSetAtom(cartItemsAtom);
  const setCartOpen = useSetAtom(cartOpenAtom);

  const handleAddCupToCart = () => {
    if (!imageSrc) {
      toast.error("Por favor sube una imagen primero");
      return;
    }

    setCart((prev: any) => [
      ...prev,
      {
        cartItemId: `cup-${Date.now()}`,
        productId: "taza-personalizada", 
        name: "Taza Personalizada Mágica",
        unitPrice: 250, 
        quantity: 1,
        image: imageSrc, 
        slug: "taza-personalizada",
      },
    ]);

    toast.success("Taza añadida a tu pedido");
    setCartOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-6 md:p-10 max-w-6xl mx-auto items-center lg:items-start bg-white rounded-3xl border border-lilaPastel shadow-sm">
      
      {/* Columna Izquierda: El Canvas con Responsive Scaling */}
      <div className="w-full lg:w-1/2 flex justify-center overflow-hidden">
        {/* Aquí está la magia responsiva: escalamos el contenedor en móviles */}
        <div className="scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 origin-top lg:origin-top-left transition-transform duration-300">
          <CupCanvas uploadedImageSrc={imageSrc} />
        </div>
      </div>

      {/* Columna Derecha: Controles */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6 pt-0 lg:pt-8 -mt-24 sm:-mt-16 md:-mt-10 lg:mt-0">
        <div>
          <span className="text-sm font-bold text-sage uppercase tracking-widest block mb-2">Complemento Especial</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#3A243F] mb-3">Taza Personalizada Mágica</h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Sube tu foto favorita y ajusta el diseño. La imprimiremos y la agregaremos dentro o junto a tu arreglo de globos para hacer tu regalo aún más inolvidable.
          </p>
        </div>

        {/* Botón de Subida */}
        <label className="flex items-center justify-center gap-2 bg-[#F5EFF6] hover:bg-[#EBE0EC] text-[#3A243F] border border-lilaPastel px-6 py-4 rounded-xl cursor-pointer transition-colors shadow-sm w-full md:w-auto">
          <UploadSimpleIcon size={24} weight="bold" className="text-terracota" />
          <span className="font-bold">Subir mi Imagen</span>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload} 
          />
        </label>

        {/* Instrucciones */}
        <div className="bg-cream/50 p-5 rounded-xl border border-lilaPastel/50">
          <h3 className="font-bold text-[#3A243F] mb-2 text-sm">¿Cómo funciona?</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5">
            <li>Sube tu imagen (PNG o JPG).</li>
            <li>Haz clic sobre tu imagen en la taza.</li>
            <li>Arrastra para moverla, usa las esquinas para hacerla más grande o pequeña y el círculo superior para rotarla.</li>
          </ul>
        </div>

        {/* Agregar al Carrito (Complemento) */}
        <div className="mt-4 pt-6 border-t border-lilaPastel flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-sm font-bold text-gray-400">Precio del complemento</span>
            <span className="text-3xl font-bold text-terracota">$250.00 <span className="text-sm font-normal text-gray-500">MXN</span></span>
          </div>
          <button onClick={handleAddCupToCart} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#3A243F] hover:bg-opacity-90 text-white px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg font-bold">
            <ShoppingCartIcon size={20} weight="bold" />
            Añadir a mi pedido
          </button>
        </div>
      </div>
      
    </div>
  );
}