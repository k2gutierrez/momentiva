"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, FloppyDiskIcon, PlusIcon, TrashIcon, ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { createProduct } from "@/actions/products";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isStockItem, setIsStockItem] = useState(false);
  const [isCustomCup, setIsCustomCup] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Estructura actualizada para soportar choices y required
  const [customOptions, setCustomOptions] = useState<
    { name: string; type: string; priceImpact: number; choices: string; required: boolean }[]
  >([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("id, name").order("name", { ascending: true });
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleAddOption = () => {
    setCustomOptions([...customOptions, { name: "", type: "select", priceImpact: 0, choices: "", required: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setCustomOptions(customOptions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const updated = [...customOptions];
    updated[index] = { ...updated[index], [field]: value };
    setCustomOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("isStockItem", isStockItem.toString());
      formData.append("isCustomCup", isCustomCup.toString());

      // Transformamos el string de choices "Rojo, Azul" a un arreglo ["Rojo", "Azul"] antes de guardar
      const formattedOptions = customOptions.map(opt => ({
        ...opt,
        choices: opt.type === "select" ? opt.choices.split(",").map(c => c.trim()).filter(c => c !== "") : []
      }));

      formData.append("customOptions", JSON.stringify(formattedOptions));

      const result = await createProduct(formData);

      if (result.success) {
        toast.success("Producto creado exitosamente");
        router.push("/admin/products");
      } else {
        toast.error(result.error || "Error al crear el producto");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="p-2 bg-white rounded-full text-sage hover:bg-lilaPastel transition-colors shadow-sm">
          <ArrowLeftIcon size={24} />
        </Link>
        <h2 className="text-3xl font-bold text-berenjena">Crear Nuevo Producto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ... (Las secciones de Imagen, Info General, Precios y Reglas se mantienen exactamente igual que tu código original) ... */}
        {/* Basic Information, Pricing & Margins, Inventory & Special Rules -> Pégalos aquí de tu código anterior */}

        {/* Opciones Dinámicas Actualizadas */}
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
                          <option value="textarea">Texto Largo (Mensaje)</option>
                          <option value="checkbox">Casilla (Sí/No)</option>
                          <option value="image">Subir Imagen</option>
                        </select>
                      </div>
                    </div>

                    {/* Mostrar campo de choices solo si es select */}
                    {opt.type === "select" && (
                      <div>
                        <label className="block text-xs font-bold text-berenjena mb-1">Opciones (separadas por coma)</label>
                        <input type="text" value={opt.choices} onChange={(e) => handleOptionChange(index, "choices", e.target.value)} className="w-full px-2 py-1 border border-lilaPastel rounded bg-white text-sm" placeholder="Rosa, Azul, Dorado" required={opt.type === "select"} />
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