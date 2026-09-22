"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash, Power, Image as ImageIcon, PencilSimple, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { createCarouselSlide, toggleCarouselSlide, deleteCarouselSlide, updateCarouselSlideImages } from "@/actions/carousels";
import { toast } from "sonner";

interface CarouselSlideRow {
  id: string;
  title: string | null;
  image_url: string;
  mobile_image_url: string | null;
  order_index: number;
  is_active: boolean;
}

export default function AdminCarouselsPage() {
  const [slides, setSlides] = useState<CarouselSlideRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSlides = async (): Promise<CarouselSlideRow[]> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("homepage_carousel")
      .select("*")
      .order("order_index", { ascending: true });

    return data ?? [];
  };

  const refreshSlides = async () => {
    setIsLoading(true);
    setSlides(await loadSlides());
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchSlides = async () => {
      setIsLoading(true);
      setSlides(await loadSlides());
      setIsLoading(false);
    };
    fetchSlides();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createCarouselSlide(formData);

    if (result.success) {
      toast.success("Imagen agregada al carrusel");
      if (result.note) {
        toast.info(result.note, { duration: 9000 });
      }
      (e.target as HTMLFormElement).reset();
      refreshSlides();
    } else {
      toast.error(result.error || "Error al agregar imagen");
    }

    setIsSubmitting(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const result = await toggleCarouselSlide(id, currentStatus);
    if (result.success) {
      toast.success(currentStatus ? "Slide desactivado" : "Slide activado");
      refreshSlides();
    } else {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Segura de eliminar este slide del carrusel?")) return;
    const result = await deleteCarouselSlide(id);
    if (result.success) {
      toast.success("Slide eliminado");
      refreshSlides();
    } else {
      toast.error("Error al eliminar slide");
    }
  };

  const handleUpdateImages = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateCarouselSlideImages(id, formData);

    if (result.success) {
      toast.success("Imágenes del slide actualizadas");
      setEditingId(null);
      refreshSlides();
    } else {
      toast.error(result.error || "Error al actualizar imágenes");
    }

    setIsSubmitting(false);
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-lilaPastel lg:sticky lg:top-6">
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
                <label className="block text-sm font-bold text-berenjena mb-1">Fotografía Banner (Desktop)</label>
                <input
                  type="file"
                  name="image"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  required
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sage/20 file:text-sage hover:file:bg-sage/30 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Imagen para Celular (Opcional)</label>
                <input
                  type="file"
                  name="mobileImage"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sage/20 file:text-sage hover:file:bg-sage/30 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Si no subes una, en el celular se usará la imagen de escritorio recortada al centro.
                </p>
              </div>

              <div className="bg-cream/60 rounded-lg p-3 text-[11px] text-gray-600 leading-relaxed">
                <p className="font-bold text-berenjena mb-1">📐 Medidas recomendadas:</p>
                <p>• Desktop: <strong>3600 × 1552 px</strong> (proporción 2.32:1) — mínimo 2000 px de ancho.</p>
                <p>• Celular: <strong>1200 × 800 px</strong> (proporción 3:2, apaisada/rectangular) — mínimo 800 px de ancho.</p>
                <p>• Formato: <strong>PNG</strong> (recomendado) o JPG/WebP. Peso máximo: <strong>5 MB</strong> por imagen.</p>
                <p>• Deja el contenido importante (texto/logo) en el centro, lejos de los bordes.</p>
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
              <div key={s.id} className="space-y-2">
                <div
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
                    {s.mobile_image_url && (
                      <span className="ml-2 inline-block text-xs font-bold bg-sage/15 text-sage px-2.5 py-1 rounded">
                        📱 Versión móvil incluida
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                      className="p-2 text-berenjena hover:bg-cream rounded-lg transition-colors"
                      title="Editar imágenes (desktop / celular)"
                    >
                      <PencilSimple size={20} />
                    </button>
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

                {/* Formulario inline para actualizar imágenes del slide */}
                {editingId === s.id && (
                  <form
                    onSubmit={(e) => handleUpdateImages(e, s.id)}
                    className="bg-cream/60 p-4 rounded-xl space-y-3"
                  >
                    <p className="text-xs font-bold text-berenjena">
                      Reemplazar imágenes de este slide (deja vacío lo que no quieras cambiar):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-berenjena mb-1">Banner Desktop (opcional)</label>
                        <input
                          type="file"
                          name="image"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sage/20 file:text-sage cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-berenjena mb-1">Banner Celular (opcional)</label>
                        <input
                          type="file"
                          name="mobileImage"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sage/20 file:text-sage cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-1 bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        <CheckCircle size={16} /> {isSubmitting ? "Guardando..." : "Guardar Imágenes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs font-bold text-gray-500 hover:text-berenjena px-4 py-2"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}