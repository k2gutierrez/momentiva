"use client";

import React, { useEffect, useState } from "react";
import { PlusIcon, TrashIcon, TagIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { createCategory, deleteCategory } from "@/actions/categories";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live categories from Supabase
  const fetchCategories = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (data) setCategories(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await createCategory(formData);

    if (result.success) {
      toast.success("Categoría creada exitosamente");
      (e.target as HTMLFormElement).reset(); // Clear the form
      fetchCategories(); // Refresh the list
    } else {
      toast.error(result.error || "Error al crear la categoría");
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás segura de que deseas eliminar la categoría "${name}"?`)) return;
    
    const result = await deleteCategory(id);
    if (result.success) {
      toast.success("Categoría eliminada");
      fetchCategories();
    } else {
      toast.error("Error al eliminar la categoría");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-berenjena">Gestión de Categorías</h2>
        <p className="text-gray-500 mt-2">Organiza tus productos para facilitar la navegación de tus clientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-lilaPastel sticky top-6">
            <h3 className="text-xl font-bold text-berenjena mb-4 flex items-center gap-2">
              <PlusIcon size={24} className="text-sage" />
              Nueva Categoría
            </h3>
            
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Nombre</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena" 
                  placeholder="Ej. Arreglos Florales" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Descripción</label>
                <textarea 
                  name="description" 
                  rows={3} 
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena" 
                  placeholder="Pequeña descripción (opcional)..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white py-3 rounded-lg shadow-md transition-colors font-bold"
              >
                {isSubmitting ? "Guardando..." : "Guardar Categoría"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Categories List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-lilaPastel overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream/50 text-berenjena text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">Categoría</th>
                  <th className="p-4 font-bold">Slug (URL)</th>
                  <th className="p-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-berenjena divide-y divide-lilaPastel/50">
                {isLoading ? (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-500">Cargando categorías...</td></tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-gray-500">
                      <TagIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
                      <p>No hay categorías creadas todavía.</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-cream/30 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-berenjena">{category.name}</div>
                        {category.description && <div className="text-sm text-gray-500 mt-1 line-clamp-1">{category.description}</div>}
                      </td>
                      <td className="p-4 text-sage text-sm">/{category.slug}</td>
                      <td className="p-4 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(category.id, category.name)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Eliminar"
                        >
                          <TrashIcon size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}