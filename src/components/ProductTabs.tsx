"use client";

import React, { useState } from "react";
import { HeartIcon, ShieldCheckIcon, TruckIcon } from "@phosphor-icons/react/dist/ssr";

interface ProductTabsProps {
  description: string;
}

export default function ProductTabs({ description }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"descripcion" | "informacion">("descripcion");

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
      {/* Pestañas */}
      <div className="flex border-b-2 border-lilaPastel">
        <button
          onClick={() => setActiveTab("descripcion")}
          className={`px-6 py-3 text-sm md:text-base font-bold transition-colors border-b-2 -mb-0.5 ${
            activeTab === "descripcion"
              ? "text-terracota border-terracota"
              : "text-gray-400 border-transparent hover:text-berenjena"
          }`}
        >
          Descripción
        </button>
        <button
          onClick={() => setActiveTab("informacion")}
          className={`px-6 py-3 text-sm md:text-base font-bold transition-colors border-b-2 -mb-0.5 ${
            activeTab === "informacion"
              ? "text-terracota border-terracota"
              : "text-gray-400 border-transparent hover:text-berenjena"
          }`}
        >
          Información adicional
        </button>
      </div>

      {/* Contenido */}
      <div className="py-8">
        {activeTab === "descripcion" ? (
          <div className="max-w-3xl text-gray-700 leading-relaxed text-base md:text-lg whitespace-pre-line">
            {description || "Un detalle inolvidable preparado a mano en Guadalajara."}
          </div>
        ) : (
          <div className="max-w-3xl space-y-6">
            {/* Duración */}
            <div className="flex items-start gap-4 bg-cream/60 rounded-2xl p-6">
              <HeartIcon size={28} className="text-terracota shrink-0" weight="fill" />
              <div>
                <h4 className="font-bold text-berenjena mb-1">Tiempo de vida</h4>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  Nuestros globos se inflan con aire, no con helio, por eso tu arreglo dura varias semanas.
                  Sigue los cuidados que te compartimos al entregártelo y se mantendrá hermoso por más tiempo.
                </p>
              </div>
            </div>

            {/* Garantía */}
            <div className="flex items-start gap-4 bg-cream/60 rounded-2xl p-6">
              <ShieldCheckIcon size={28} className="text-sage shrink-0" weight="fill" />
              <div>
                <h4 className="font-bold text-berenjena mb-1">Garantía</h4>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  Una vez entregados los globos en buen estado no cuentan con garantía, ya que dejan de estar
                  a nuestro cuidado y es responsabilidad única de quien lo recibe tener los debidos cuidados
                  para que tengan la mayor duración posible.
                </p>
              </div>
            </div>

            {/* Entregas */}
            <div className="flex items-start gap-4 bg-cream/60 rounded-2xl p-6">
              <TruckIcon size={28} className="text-terracota shrink-0" weight="fill" />
              <div>
                <h4 className="font-bold text-berenjena mb-1">Entregas</h4>
                <ul className="text-gray-600 text-sm md:text-base leading-relaxed list-disc pl-5 space-y-1">
                  <li>Realizamos entregas a domicilio en Guadalajara, Zapopan, Tlajomulco y Tlaquepaque.</li>
                  <li>Dos horarios de entrega: de 9am a 1pm, o de 1pm a 6pm.</li>
                  <li>Pide con al menos 3 días de anticipación.</li>
                  <li>Al momento de tu compra podrás consultar si tu zona tiene cobertura gratuita o cuenta con un costo adicional.</li>
                  <li>No entregamos dentro de plazas comerciales.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
