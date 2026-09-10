"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, FloppyDiskIcon, PlusIcon, TrashIcon, ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { createProduct } from "@/actions/products";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface CustomOption {
  name: string;
  type: "select" | "text" | "textarea" | "checkbox" | "image";
  priceImpact: number;
  choices: string[];
  required: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isStockItem, setIsStockItem] = useState(false);
  const [isCustomCup, setIsCustomCup] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [customOptions, setCustomOptions] = useState<CustomOption[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("id, name").order("name", { ascending: true });
      if (data) setCategories(data as Category[]);
    };
    fetchCategories();
  }, []);

  const handleAddOption = () => {
    setCustomOptions([...customOptions, { name: "", type: "select", priceImpact: 0, choices: [], required: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setCustomOptions(customOptions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, field: keyof CustomOption, value: unknown) => {
    const updated = [...customOptions];
    updated[index] = { ...updated[index], [field]: value };
    setCustomOptions(updated);
  };

  // --- Recuadros individuales para las opciones de la lista desplegable ---
  const handleAddChoice = (index: number) => {
    const updated = [...customOptions];
    updated[index] = { ...updated[index], choices: [...updated[index].choices, ""] };
    setCustomOptions(updated);
  };

  const handleChoiceChange = (index: number, choiceIdx: number, value: string) => {
    const updated = [...customOptions];
    const choices = [...updated[index].choices];
    choices[choiceIdx] = value;
    updated[index] = { ...updated[index], choices };
    setCustomOptions(updated);
  };

  const handleRemoveChoice = (index: number, choiceIdx: number) => {
    const updated = [...customOptions];
    updated[index] = {
      ...updated[index],
      choices: updated[index].choices.filter((_, i) => i !== choiceIdx),
    };
    setCustomOptions(updated);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewImages((prev) => [...prev, ...urls]);
  };

  const handleRemovePreview = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Validar peso de cada imagen antes de enviarla al servidor
      const imageFiles = formData
        .getAll("images")
        .filter((f): f is File => f instanceof File && f.size > 0);
      if (imageFiles.length > 8) {
        toast.error("Máximo 8 imágenes por producto.");
        setIsLoading(false);
        return;
      }
      for (const f of imageFiles) {
        if (f.size / (1024 * 1024) > 5) {
          toast.error(`"${f.name}" pesa más de 5MB. Por favor, comprímela.`);
          setIsLoading(false);
          return;
        }
      }

      formData.append("isStockItem", isStockItem.toString());
      formData.append("isCustomCup", isCustomCup.toString());

      const formattedOptions = customOptions.map((opt) => ({
        ...opt,
        choices:
          opt.type === "select"
            ? opt.choices.map((c) => c.trim()).filter((c) => c !== "")
            : [],
      }));

      formData.append("customOptions", JSON.stringify(formattedOptions));

      const result = await createProduct(formData);

      if (result.success) {
        toast.success("Producto creado exitosamente");
        router.push("/admin/products");
      } else {
        toast.error("Error al guardar: " + result.error);
      }
    } catch (error) {
      toast.error("Error en el formulario: " + (error instanceof Error ? error.message : "Revisa los campos"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="p-2 bg-white rounded-full text-sage hover:bg-lilaPastel transition-colors shadow-sm">
          <ArrowLeftIcon size={24} />
        </Link>
        <h2 className="text-3xl font-bold text-berenjena">Crear Nuevo Producto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Galería de Imágenes (múltiples) */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-2 mb-4">Imágenes del Producto</h3>
          <p className="text-xs text-gray-400">Puedes subir más de una foto (máximo 8). La primera será la portada.</p>

          {previewImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previewImages.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-lilaPastel group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Vista previa ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePreview(idx)}
                    className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-cream rounded-lg flex items-center justify-center border-2 border-dashed border-lilaPastel text-sage shrink-0">
              <ImageIcon size={32} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-berenjena mb-1">Subir Fotografía(s)</label>
              <input
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sage/20 file:text-sage hover:file:bg-sage/30 cursor-pointer"
              />
              <p className="text-xs text-gray-400 mt-1">Recomendado: PNG o JPG cuadrado (800x800px).</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-2 mb-4">Información General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Nombre del Producto</label>
              <input type="text" name="name" required className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena" placeholder="Ej. Taza de Cerámica" />
            </div>
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Categoría</label>
              <select
                name="categoryId"
                required
                className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
              >
                <option value="">Selecciona una categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-berenjena mb-1">Descripción</label>
            <textarea name="description" rows={3} required className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena" placeholder="Detalles del producto..."></textarea>
          </div>
        </div>

        {/* Pricing & Margins */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-2 mb-4">Precios y Márgenes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Precio de Venta ($)</label>
              <input type="number" step="0.01" name="price" required className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1 text-sage">Costo Bruto ($) - Privado</label>
              <input type="number" step="0.01" name="rawCost" required className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena" placeholder="Para cálculo de margen" />
            </div>
          </div>
        </div>

        {/* Inventory & Special Rules */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-2 mb-4">Reglas y Logística</h3>
          <div className="flex items-center gap-4 mb-4">
            <input type="checkbox" id="stockToggle" className="w-5 h-5 accent-terracota cursor-pointer" checked={isStockItem} onChange={() => setIsStockItem(!isStockItem)} />
            <label htmlFor="stockToggle" className="font-bold text-berenjena cursor-pointer">Es artículo en Stock (Envío mismo día)</label>
          </div>
          {isStockItem ? (
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Cantidad en Inventario</label>
              <input type="number" name="stockQuantity" className="w-1/3 px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena" placeholder="0" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Días de Anticipación Requeridos</label>
              <input type="number" name="anticipationDays" className="w-1/3 px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena" placeholder="Ej. 2" />
            </div>
          )}
          <div className="flex items-center gap-4 mt-6">
            <input type="checkbox" id="cupToggle" className="w-5 h-5 accent-terracota cursor-pointer" checked={isCustomCup} onChange={() => setIsCustomCup(!isCustomCup)} />
            <label htmlFor="cupToggle" className="font-bold text-berenjena cursor-pointer">Habilitar Previsualizador 2D de Taza para este producto</label>
          </div>
        </div>

        {/* Opciones Dinámicas con Recuadros Individuales */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <div className="flex justify-between items-center border-b border-lilaPastel pb-2 mb-4">
            <h3 className="text-xl font-bold text-berenjena">Opciones de Personalización</h3>
            <button type="button" onClick={handleAddOption} className="text-sm flex items-center gap-1 bg-sage hover:bg-opacity-80 text-white px-3 py-1 rounded transition-colors font-bold">
              <PlusIcon size={16} weight="bold" /> Agregar Opción
            </button>
          </div>

          {customOptions.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No hay opciones extra configuradas.</p>
          ) : (
            <div className="space-y-4">
              {customOptions.map((opt, index) => (
                <div key={index} className="flex flex-wrap items-start gap-3 bg-cream/50 p-4 rounded-lg border border-lilaPastel">

                  <div className="flex-1 min-w-[200px] space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-berenjena mb-1">Nombre de la opción</label>
                        <input type="text" value={opt.name} onChange={(e) => handleOptionChange(index, "name", e.target.value)} className="w-full px-2 py-1 border border-lilaPastel rounded bg-white text-sm" placeholder="Ej. Color de listón" required />
                      </div>
                      <div className="w-1/3">
                        <label className="block text-xs font-bold text-berenjena mb-1">Tipo</label>
                        <select value={opt.type} onChange={(e) => handleOptionChange(index, "type", e.target.value)} className="w-full px-2 py-1 border border-lilaPastel rounded bg-white text-sm">
                          <option value="select">Lista Desplegable</option>
                          <option value="text">Texto Corto</option>
                          <option value="textarea">Recuadro de Texto (Mensaje)</option>
                          <option value="checkbox">Casilla (Sí/No)</option>
                          <option value="image">Subir Imagen(es)</option>
                        </select>
                      </div>
                    </div>

                    {/* Recuadros individuales para cada opción de la lista desplegable */}
                    {opt.type === "select" && (
                      <div className="bg-white p-3 rounded-lg border border-lilaPastel/70">
                        <label className="block text-xs font-bold text-berenjena mb-2">Opciones de la lista</label>
                        <div className="space-y-2">
                          {opt.choices.map((choice, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={choice}
                                onChange={(e) => handleChoiceChange(index, cIdx, e.target.value)}
                                className="flex-1 px-2 py-1.5 border border-lilaPastel rounded bg-white text-sm"
                                placeholder={`Opción ${cIdx + 1}`}
                              />
                              <button type="button" onClick={() => handleRemoveChoice(index, cIdx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label="Quitar opción">
                                <TrashIcon size={16} />
                              </button>
                            </div>
                          ))}
                          {opt.choices.length === 0 && (
                            <p className="text-xs text-gray-400 italic">Agrega las opciones con el botón de abajo.</p>
                          )}
                          <button type="button" onClick={() => handleAddChoice(index)} className="flex items-center gap-1 text-xs font-bold text-sage hover:text-berenjena transition-colors">
                            <PlusIcon size={14} weight="bold" /> Agregar recuadro de opción
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id={`req-${index}`} checked={opt.required} onChange={(e) => handleOptionChange(index, "required", e.target.checked)} className="accent-terracota" />
                      <label htmlFor={`req-${index}`} className="text-xs text-berenjena">Es obligatorio que el cliente lo llene</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-berenjena mb-1">Costo Extra ($)</label>
                    <input type="number" step="0.01" value={opt.priceImpact} onChange={(e) => handleOptionChange(index, "priceImpact", parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border border-lilaPastel rounded bg-white text-sm" placeholder="0.00" />
                  </div>

                  <button type="button" onClick={() => handleRemoveOption(index)} className="p-2 mt-4 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <TrashIcon size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 pb-12">
          <Link href="/admin/products" className="px-6 py-3 font-bold text-sage hover:text-berenjena transition-colors">Cancelar</Link>
          <button type="submit" disabled={isLoading} className="flex items-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white px-8 py-3 rounded-lg shadow-md transition-colors font-bold">
            <FloppyDiskIcon size={20} weight="bold" /> {isLoading ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>
      </form>
    </div>
  );
}
