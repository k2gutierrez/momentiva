"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, FloppyDiskIcon, PlusIcon, TrashIcon, ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { updateProduct } from "@/actions/products";
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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Estados del formulario
  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [rawCost, setRawCost] = useState("");
  const [isStockItem, setIsStockItem] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [anticipationDays, setAnticipationDays] = useState("");
  const [isCustomCup, setIsCustomCup] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [customOptions, setCustomOptions] = useState<CustomOption[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { id } = await params;
      setProductId(id);

      const supabase = createClient();

      // Cargar categorías
      const { data: cats } = await supabase.from("categories").select("id, name").order("name", { ascending: true });
      if (cats) setCategories(cats as Category[]);

      // Cargar producto
      const { data: product, error } = await supabase.from("products").select("*").eq("id", id).single();

      if (error || !product) {
        toast.error("Producto no encontrado");
        router.push("/admin/products");
        return;
      }

      setName(product.name || "");
      setCategoryId(product.category_id || "");
      setDescription(product.description || "");
      setPrice(product.price?.toString() || "");
      setRawCost(product.raw_cost?.toString() || "");
      setIsStockItem(product.is_in_stock_item || false);
      setStockQuantity(product.stock_quantity?.toString() || "");
      setAnticipationDays(product.anticipation_days?.toString() || "");
      setIsCustomCup(product.is_custom_cup || false);
      setExistingImages(Array.isArray(product.images) ? (product.images as string[]) : []);

      // Procesar custom_options (choices ya es un arreglo)
      const options: CustomOption[] = Array.isArray(product.custom_options)
        ? product.custom_options.map((opt: Record<string, unknown>) => ({
            name: (opt.name as string) || "",
            type: (opt.type as CustomOption["type"]) || "text",
            priceImpact: Number(opt.priceImpact) || 0,
            choices: Array.isArray(opt.choices) ? (opt.choices as string[]) : [],
            required: Boolean(opt.required),
          }))
        : [];
      setCustomOptions(options);

      setIsFetching(false);
    };

    loadData();
  }, [params, router]);

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

  const handleRemoveExisting = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
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

      // Validar peso de cada imagen nueva
      const imageFiles = formData
        .getAll("images")
        .filter((f): f is File => f instanceof File && f.size > 0);
      if (existingImages.length + imageFiles.length > 8) {
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
      formData.append("existingImages", JSON.stringify(existingImages));

      const formattedOptions = customOptions.map((opt) => ({
        ...opt,
        choices:
          opt.type === "select"
            ? opt.choices.map((c) => c.trim()).filter((c) => c !== "")
            : [],
      }));

      formData.append("customOptions", JSON.stringify(formattedOptions));

      const result = await updateProduct(productId, formData);

      if (result.success) {
        toast.success("Producto actualizado exitosamente");
        router.push("/admin/products");
      } else {
        toast.error("Error al actualizar: " + result.error);
      }
    } catch (error) {
      toast.error("Falla en el formulario: " + (error instanceof Error ? error.message : "Revisa los datos ingresados"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="text-center py-20 text-sage font-bold">Cargando datos del producto...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="p-2 bg-white rounded-full text-sage hover:bg-lilaPastel transition-colors shadow-sm">
          <ArrowLeftIcon size={24} />
        </Link>
        <h2 className="text-3xl font-bold text-berenjena">Editar Producto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Galería de Imágenes (múltiples) */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-2 mb-4">Imágenes del Producto</h3>
          <p className="text-xs text-gray-400">La primera imagen es la portada. Puedes tener hasta 8 fotos.</p>

          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {existingImages.map((src, idx) => (
                <div key={`existing-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-lilaPastel group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExisting(idx)}
                    className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          {previewImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previewImages.map((src, idx) => (
                <div key={`preview-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-dashed border-sage group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Nueva ${idx + 1}`} className="w-full h-full object-cover" />
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

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-cream rounded-lg flex items-center justify-center border-2 border-dashed border-lilaPastel text-sage shrink-0">
              <ImageIcon size={32} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-berenjena mb-1">Agregar Fotografía(s) (Opcional)</label>
              <input type="file" name="images" accept="image/*" multiple onChange={handleImageSelect} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sage/20 file:text-sage hover:file:bg-sage/30 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Info Básica */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-2 mb-4">Información General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Nombre del Producto</label>
              <input type="text" name="name" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Categoría</label>
              <select name="categoryId" value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-white">
                <option value="">Selecciona una categoría...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-berenjena mb-1">Descripción</label>
            <textarea name="description" rows={3} value={description} onChange={e => setDescription(e.target.value)} required className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-white"></textarea>
          </div>
        </div>

        {/* Precios */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-2 mb-4">Precios y Márgenes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Precio de Venta ($)</label>
              <input type="number" step="0.01" name="price" value={price} onChange={e => setPrice(e.target.value)} required className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1 text-sage">Costo Bruto ($) - Privado</label>
              <input type="number" step="0.01" name="rawCost" value={rawCost} onChange={e => setRawCost(e.target.value)} required className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-white" />
            </div>
          </div>
        </div>

        {/* Inventario */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-2 mb-4">Reglas y Logística</h3>
          <div className="flex items-center gap-4 mb-4">
            <input type="checkbox" id="stockToggle" checked={isStockItem} onChange={() => setIsStockItem(!isStockItem)} className="w-5 h-5 accent-terracota" />
            <label htmlFor="stockToggle" className="font-bold text-berenjena">Es artículo en Stock</label>
          </div>
          {isStockItem ? (
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Cantidad en Inventario</label>
              <input type="number" name="stockQuantity" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} className="w-1/3 px-3 py-2 border border-lilaPastel rounded-lg bg-white" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Días de Anticipación Requeridos</label>
              <input type="number" name="anticipationDays" value={anticipationDays} onChange={e => setAnticipationDays(e.target.value)} className="w-1/3 px-3 py-2 border border-lilaPastel rounded-lg bg-white" />
            </div>
          )}
          <div className="flex items-center gap-4 mt-6">
            <input type="checkbox" id="cupToggle" checked={isCustomCup} onChange={() => setIsCustomCup(!isCustomCup)} className="w-5 h-5 accent-terracota" />
            <label htmlFor="cupToggle" className="font-bold text-berenjena">Habilitar Previsualizador 2D de Taza</label>
          </div>
        </div>

        {/* Opciones */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <div className="flex justify-between items-center border-b border-lilaPastel pb-2 mb-4">
            <h3 className="text-xl font-bold text-berenjena">Opciones de Personalización</h3>
            <button type="button" onClick={handleAddOption} className="text-sm flex items-center gap-1 bg-sage text-white px-3 py-1 rounded font-bold">
              <PlusIcon size={16} /> Agregar Opción
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
                        <input type="text" value={opt.name} onChange={e => handleOptionChange(index, "name", e.target.value)} className="w-full px-2 py-1 border border-lilaPastel rounded bg-white text-sm" required />
                      </div>
                      <div className="w-1/3">
                        <label className="block text-xs font-bold text-berenjena mb-1">Tipo</label>
                        <select value={opt.type} onChange={e => handleOptionChange(index, "type", e.target.value)} className="w-full px-2 py-1 border border-lilaPastel rounded bg-white text-sm">
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
                      <input type="checkbox" checked={opt.required} onChange={e => handleOptionChange(index, "required", e.target.checked)} className="accent-terracota" />
                      <label className="text-xs text-berenjena">Es obligatorio</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-berenjena mb-1">Costo Extra ($)</label>
                    <input type="number" step="0.01" value={opt.priceImpact} onChange={e => handleOptionChange(index, "priceImpact", parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border border-lilaPastel rounded bg-white text-sm" />
                  </div>
                  <button type="button" onClick={() => handleRemoveOption(index)} className="p-2 mt-4 text-red-400 hover:bg-red-50 rounded">
                    <TrashIcon size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 pb-12">
          <Link href="/admin/products" className="px-6 py-3 font-bold text-sage">Cancelar</Link>
          <button type="submit" disabled={isLoading} className="flex items-center gap-2 bg-terracota text-white px-8 py-3 rounded-lg font-bold disabled:opacity-70">
            <FloppyDiskIcon size={20} /> {isLoading ? "Guardando..." : "Actualizar Producto"}
          </button>
        </div>
      </form>
    </div>
  );
}
