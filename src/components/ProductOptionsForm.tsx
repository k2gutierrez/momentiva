"use client";

import React, { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { entregaSeleccionadaAtom, quiereComplementosAtom } from "@/store/complementosStore";
import AddToCartButton from "./AddToCartButton";
import DeliveryDateTimePicker from "./DeliveryDateTimePicker";
import { ImageSquareIcon } from "@phosphor-icons/react/dist/ssr";
import { comprimirImagen as compressImage } from "@/lib/imagen";

interface OptionDef {
  name: string;
  type: "text" | "textarea" | "select" | "checkbox" | "image";
  required?: boolean;
  choices?: string[]; // Para los selects (ej. ["Rosa", "Azul", "Dorado"])
  priceImpact?: number;
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
  anticipationDays?: number;
  blockedDates?: string[];
  /** Solo los productos con "Complementa tu regalo" activado muestran la pregunta. */
  tieneComplementos?: boolean;
}

export default function ProductOptionsForm({
  product,
  anticipationDays = 0,
  blockedDates = [],
  tieneComplementos = false,
}: ProductOptionsFormProps) {
  // Estado para guardar lo que el cliente elige
  const [selections, setSelections] = useState<Record<string, string | boolean | string[]>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string[]>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [quiereComplementos, setQuiereComplementos] = useAtom(quiereComplementosAtom);
  const setEntregaSeleccionada = useSetAtom(entregaSeleccionadaAtom);

  // La fecha y hora elegidas aquí las heredan los complementos que se agreguen
  useEffect(() => {
    setEntregaSeleccionada({ fecha: deliveryDate, hora: deliveryTime });
  }, [deliveryDate, deliveryTime, setEntregaSeleccionada]);

  const handleInputChange = (name: string, value: string | boolean | string[]) => {
    setSelections((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (name: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files).slice(0, 5); // máx 5 fotos
    const compressed = await Promise.all(incoming.map((archivo) => compressImage(archivo)));

    setImagePreviews((prev) => ({
      ...prev,
      [name]: [...(prev[name] || []), ...compressed],
    }));
    setSelections((prev) => ({
      ...prev,
      [name]: [...((prev[name] as string[]) || []), ...compressed],
    }));
  };

  const removeImage = (name: string, index: number) => {
    setImagePreviews((prev) => ({
      ...prev,
      [name]: (prev[name] || []).filter((_, i) => i !== index),
    }));
    setSelections((prev) => ({
      ...prev,
      [name]: ((prev[name] as string[]) || []).filter((_, i) => i !== index),
    }));
  };

  // Convertimos el JSON de Supabase (si existe) a un arreglo
  const options: OptionDef[] = Array.isArray(product.custom_options)
    ? product.custom_options
    : [];

  return (
    <div className="w-full mb-8">
      {options.length > 0 && (
        <div className="bg-[#EFE6F4] p-5 rounded-2xl mb-6 space-y-4 shadow-md">
          <h3 className="text-[#3A243F] font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-terracota"></span>
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

              {opt.type === "textarea" && (
                <textarea
                  rows={4}
                  required={opt.required}
                  placeholder={`Escribe aquí tu ${opt.name.toLowerCase()}`}
                  className="w-full px-4 py-3 rounded-xl border border-lilaPastel bg-white focus:outline-none focus:border-terracota text-sm text-gray-700 resize-y"
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

              {opt.type === "image" && (
                <div className="space-y-3">
                  <label className="flex items-center justify-center gap-2 bg-white hover:bg-cream text-[#3A243F] border-2 border-dashed border-lilaPastel px-4 py-4 rounded-xl cursor-pointer transition-colors">
                    <ImageSquareIcon size={22} className="text-terracota" />
                    <span className="font-bold text-sm">
                      Sube tu(s) fotografía(s) — hasta 5
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(opt.name, e.target.files)}
                    />
                  </label>
                  {(imagePreviews[opt.name]?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {imagePreviews[opt.name].map((src, pIdx) => (
                        <div key={pIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-lilaPastel group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Foto ${pIdx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(opt.name, pIdx)}
                            className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ¿Quiere agregar complementos? Solo si el producto los acepta.
          Si dice "no", no se muestra nada abajo. */}
      {tieneComplementos && (
      <div className="bg-[#EFE6F4] p-5 rounded-2xl mb-6 shadow-md">
        <h3 className="text-[#3A243F] font-bold text-sm uppercase tracking-wider mb-1">
          ¿Quieres agregar un complemento?
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          🎁 Suma a tu regalo una taza personalizada, suculentas, pastel, cervezas o
          charcutería. Puedes elegirlo ahora o dejarlo solo con el globo.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => {
              setQuiereComplementos(true);
              // El bloque aparece más abajo: lo llevamos a la vista
              setTimeout(() => {
                document
                  .getElementById("complementa-tu-regalo")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 120);
            }}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              quiereComplementos
                ? "bg-terracota text-white shadow-md"
                : "bg-white text-[#3A243F] border border-lilaPastel hover:border-terracota"
            }`}
          >
            Sí, ver complementos
          </button>
          <button
            type="button"
            onClick={() => setQuiereComplementos(false)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              !quiereComplementos
                ? "bg-[#3A243F] text-white shadow-md"
                : "bg-white text-[#3A243F] border border-lilaPastel hover:border-terracota"
            }`}
          >
            No, gracias
          </button>
        </div>
        {quiereComplementos && (
          <a
            href="#complementa-tu-regalo"
            className="inline-block mt-3 text-xs font-bold text-terracota hover:underline"
          >
            ↓ Ver los complementos disponibles
          </a>
        )}
      </div>
      )}

      {/* Fecha y horario de entrega (disponibilidad inmediata) */}
      <DeliveryDateTimePicker
        anticipationDays={anticipationDays}
        blockedDates={blockedDates}
        deliveryDate={deliveryDate}
        deliveryTime={deliveryTime}
        onDateChange={setDeliveryDate}
        onTimeChange={setDeliveryTime}
      />

      <div className="mt-6">
        {/* Pasamos el producto, las selecciones y la fecha/horario al botón del carrito */}
        <AddToCartButton
          product={product}
          selections={selections}
          deliveryDate={deliveryDate}
          deliveryTime={deliveryTime}
          blockedDates={blockedDates}
        />
      </div>
    </div>
  );
}
