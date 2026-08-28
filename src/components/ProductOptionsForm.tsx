"use client";

import React, { useState } from "react";
import AddToCartButton from "./AddToCartButton";

interface OptionDef {
  name: string;
  type: "text" | "select" | "checkbox";
  required?: boolean;
  choices?: string[]; // Para los selects (ej. ["Rosa", "Azul", "Dorado"])
}

interface ProductOptionsFormProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    slug: string;
    custom_options: OptionDef[] | null;
  };
}

export default function ProductOptionsForm({ product }: ProductOptionsFormProps) {
  // Estado para guardar lo que el cliente elige
  const [selections, setSelections] = useState<Record<string, string | boolean>>({});

  const handleInputChange = (name: string, value: string | boolean) => {
    setSelections((prev) => ({ ...prev, [name]: value }));
  };

  // Convertimos el JSON de Supabase (si existe) a un arreglo
  const options: OptionDef[] = Array.isArray(product.custom_options) 
    ? product.custom_options 
    : [];

  return (
    <div className="w-full mb-8">
      {options.length > 0 && (
        <div className="bg-[#F5EFF6] p-5 rounded-2xl border border-lilaPastel mb-6 space-y-4">
          <h3 className="text-[#3A243F] font-bold text-sm uppercase tracking-wider mb-2">
            Personaliza tu detalle
          </h3>
          
          {options.map((opt, idx) => (
            <div key={idx} className="flex flex-col">
              <label className="text-sm font-bold text-[#3A243F] mb-1">
                {opt.name} {opt.required && <span className="text-terracota">*</span>}
              </label>

              {opt.type === "text" && (
                <input
                  type="text"
                  required={opt.required}
                  placeholder={`Ingresa ${opt.name.toLowerCase()}`}
                  className="w-full px-4 py-3 rounded-xl border border-lilaPastel bg-white focus:outline-none focus:border-terracota text-sm text-gray-700"
                  onChange={(e) => handleInputChange(opt.name, e.target.value)}
                />
              )}

              {opt.type === "select" && opt.choices && (
                <select
                  required={opt.required}
                  className="w-full px-4 py-3 rounded-xl border border-lilaPastel bg-white focus:outline-none focus:border-terracota text-sm text-gray-700"
                  onChange={(e) => handleInputChange(opt.name, e.target.value)}
                >
                  <option value="">Selecciona una opción</option>
                  {opt.choices.map((choice, cIdx) => (
                    <option key={cIdx} value={choice}>{choice}</option>
                  ))}
                </select>
              )}

              {opt.type === "checkbox" && (
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-terracota"
                    onChange={(e) => handleInputChange(opt.name, e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Sí, lo quiero</span>
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pasamos el producto y las selecciones al botón del carrito (actualizaremos el botón después si lo deseas) */}
      <AddToCartButton product={product} />
    </div>
  );
}