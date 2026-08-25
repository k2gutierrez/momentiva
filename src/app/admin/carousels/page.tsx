"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash, Power, Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { createCarouselSlide, toggleCarouselSlide, deleteCarouselSlide } from "@/actions/carousels";
import { toast } from "sonner";

export default function AdminCarouselsPage() {
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSlides = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("homepage_carousel")
      .select("*")
      .order("order_index", { ascending: true });

    if (data) setSlides(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createCarouselSlide(formData);

    if (result.success) {
      toast.success("Imagen agregada al carrusel");
      (e.target as HTMLFormElement).reset();
      fetchSlides();
    } else {
      toast.error(result.error || "Error al agregar imagen");
    }

    setIsSubmitting(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const result = await toggleCarouselSlide(id, currentStatus);
    if (result.success) {
      toast.success(currentStatus ? "Slide desactivado" : "Slide activado");
      fetchSlides();
    } else {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Segura de eliminar este slide del carrusel?")) return;
    const result = await deleteCarouselSlide(id);
    if (result.success) {
      toast.success("Slide eliminado");
      fetchSlides();
    } else {
      toast.error("Error al eliminar slide");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-berenjena">Carrusel Principal</h2>
        <p className="text-gray-500 mt-2">
          Administra las imágenes dinámicas del carrusel en la página de inicio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-lilaPastel sticky top-6">
            <h3 className="text-xl font-bold text-berenjena mb-4 flex items-center gap-2">
              <Plus size={24} className="text-terracota" />
              Nueva Imagen
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Título / Etiqueta</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Ej. Colección de Primavera"
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Orden de Aparición</label>
                <input
                  type="number"
                  name="orderIndex"
                  defaultValue={0}
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Fotografía Banner</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  required
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sage/20 file:text-sage hover:file:bg-sage/30 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white py-3 rounded-lg shadow-md transition-colors font-bold"
              >
                {isSubmitting ? "Subiendo..." : "Guardar Imagen"}
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <p className="text-gray-500">Cargando carrusel...</p>
          ) : slides.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-lilaPastel text-gray-500">
              <ImageIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
              <p>No hay imágenes agregadas al carrusel aún.</p>
            </div>
          ) : (
            slides.map((s) => (
              <div
                key={s.id}
                className={`bg-white p-4 rounded-xl border border-lilaPastel shadow-sm flex items-center justify-between gap-4 ${
                  !s.is_active ? "opacity-50 grayscale" : ""
                }`}
              >
                <img
                  src={s.image_url}
                  alt={s.title || "Banner"}
                  className="w-28 h-20 object-cover rounded-lg border border-lilaPastel"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-berenjena text-lg">{s.title || "Sin título"}</h4>
                  <span className="inline-block text-xs font-mono bg-cream px-2.5 py-1 rounded text-sage font-bold">
                    Orden: #{s.order_index}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(s.id, s.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      s.is_active ? "text-red-400 hover:bg-red-50" : "text-green-500 hover:bg-green-50"
                    }`}
                    title={s.is_active ? "Desactivar" : "Activar"}
                  >
                    <Power size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}