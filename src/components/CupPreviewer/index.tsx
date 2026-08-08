"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Upload, ShoppingCart } from '@phosphor-icons/react';

// Dynamically import the Konva canvas with SSR disabled to prevent Next.js compilation errors
const CupCanvas = dynamic(() => import('./CupCanvas'), { 
  ssr: false,
  loading: () => <div className="w-[500px] h-[500px] bg-lila-pastel animate-pulse rounded-xl flex items-center justify-center text-berenjena">Cargando visualizador...</div>
});

export default function CupPreviewer() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Handle local file upload and convert to an object URL for the canvas
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-8 max-w-6xl mx-auto items-start">
      
      {/* Left Column: The Interactive Canvas */}
      <div className="flex-shrink-0">
        <CupCanvas uploadedImageSrc={imageSrc} />
      </div>

      {/* Right Column: Controls and Add to Cart */}
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h2 className="text-3xl font-bold text-berenjena mb-2">Taza Personalizada</h2>
          <p className="text-gray-600 font-sans mb-4">Sube tu foto favorita y ajústala para crear un regalo inolvidable.</p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center justify-center gap-2 bg-sage hover:bg-opacity-80 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors shadow-sm">
          <Upload size={24} />
          <span className="font-bold">Subir Imagen</span>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload} 
          />
        </label>

        {/* Instructions */}
        <div className="bg-cream p-4 rounded-lg border border-lila-pastel">
          <h3 className="font-bold text-berenjena mb-2 font-sans">¿Cómo funciona?</h3>
          <ul className="list-disc pl-5 text-sm text-berenjena/80 space-y-1">
            <li>Sube tu imagen (PNG o JPG).</li>
            <li>Haz clic sobre tu imagen en la taza para ver los controles.</li>
            <li>Arrastra para mover, usa las esquinas para escalar y el círculo superior para rotar.</li>
            <li>El diseño se imprimirá exactamente como lo ves dentro del área de la taza.</li>
          </ul>
        </div>

        {/* Add to cart action area */}
        <div className="mt-auto pt-6 border-t border-lila-pastel">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-berenjena">Total:</span>
            <span className="text-2xl font-bold text-terracota">$250.00 MXN</span>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 text-white px-6 py-4 rounded-lg transition-colors font-bold text-lg">
            <ShoppingCart size={24} />
            Agregar al Carrito
          </button>
        </div>
      </div>
      
    </div>
  );
}