"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FloppyDisk, Plus, Trash, Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { createProduct } from "@/actions/products";
import { toast } from "sonner";

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isStockItem, setIsStockItem] = useState(false);
  const [isCustomCup, setIsCustomCup] = useState(false);
  
  // State for dynamic options (e.g., Select Box, Checkbox)
  const [customOptions, setCustomOptions] = useState<{ name: string; type: string; priceImpact: number }[]>([]);

  const handleAddOption = () => {
    setCustomOptions([...customOptions, { name: "", type: "select", priceImpact: 0 }]);
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = customOptions.filter((_, i) => i !== index);
    setCustomOptions(updatedOptions);
  };

  const handleOptionChange = (index: number, field: string, value: string | number) => {
    const updatedOptions = [...customOptions];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setCustomOptions(updatedOptions);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // Append React state variables that aren't native inputs
      formData.append("isStockItem", isStockItem.toString());
      formData.append("isCustomCup", isCustomCup.toString());
      formData.append("customOptions", JSON.stringify(customOptions));

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
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="p-2 bg-white rounded-full text-sage hover:bg-lilaPastel transition-colors shadow-sm">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-3xl font-bold text-berenjena">Crear Nuevo Producto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Image Upload Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-2 mb-4">Imagen Principal</h3>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-cream rounded-lg flex items-center justify-center border-2 border-dashed border-lilaPastel text-sage">
              <ImageIcon size={32} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-berenjena mb-1">Subir Fotografía</label>
              <input 
                type="file" 
                name="image" 
                accept="image/*"
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
              <select name="categoryId" className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena">
                <option value="">Selecciona una categoría...</option>
                <option value="regalos">Regalos</option>
                <option value="postres">Postres (Sage)</option>
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

        {/* Dynamic Options Builder */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-lilaPastel space-y-4">
          <div className="flex justify-between items-center border-b border-lilaPastel pb-2 mb-4">
            <h3 className="text-xl font-bold text-berenjena">Opciones Dinámicas</h3>
            <button type="button" onClick={handleAddOption} className="text-sm flex items-center gap-1 bg-sage hover:bg-opacity-80 text-white px-3 py-1 rounded transition-colors font-bold">
              <Plus size={16} weight="bold" /> Agregar Opción
            </button>
          </div>

          {customOptions.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No hay opciones extra configuradas. El cliente comprará el producto estándar.</p>
          ) : (
            <div className="space-y-4">
              {customOptions.map((opt, index) => (
                <div key={index} className="flex flex-wrap items-end gap-3 bg-cream/50 p-4 rounded-lg border border-lilaPastel">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-berenjena mb-1">Nombre (Ej. Agregar Globos)</label>
                    <input 
                      type="text" 
                      value={opt.name}
                      onChange={(e) => handleOptionChange(index, "name", e.target.value)}
                      className="w-full px-2 py-1 border border-lilaPastel rounded bg-white text-sm text-berenjena" 
                      placeholder="Nombre de la opción" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-berenjena mb-1">Tipo</label>
                    <select 
                      value={opt.type}
                      onChange={(e) => handleOptionChange(index, "type", e.target.value)}
                      className="px-2 py-1 border border-lilaPastel rounded bg-white text-sm text-berenjena"
                    >
                      <option value="checkbox">Checkbox (Sí/No)</option>
                      <option value="select">Lista Desplegable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-berenjena mb-1">Costo Extra ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={opt.priceImpact}
                      onChange={(e) => handleOptionChange(index, "priceImpact", parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-lilaPastel rounded bg-white text-sm text-berenjena" 
                      placeholder="0.00" 
                    />
                  </div>
                  <button type="button" onClick={() => handleRemoveOption(index)} className="p-2 mb-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <Trash size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 pb-12">
          <Link href="/admin/products" className="px-6 py-3 font-bold text-sage hover:text-berenjena transition-colors">
            Cancelar
          </Link>
          
          {/* Action button utilizing Terracota[cite: 2] */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="flex items-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white px-8 py-3 rounded-lg shadow-md transition-colors font-bold"
          >
            <FloppyDisk size={20} weight="bold" />
            {isLoading ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>

      </form>
    </div>
  );
}