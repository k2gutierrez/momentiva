"use client";

import React, { useEffect, useState } from "react";
import { TagIcon, PlusIcon, TrashIcon, PencilIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { createCategory, deleteCategory, updateCategory } from "@/actions/categories";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para la modal de edición
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (data) setCategories(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createCategory(formData);

    if (result.success) {
      toast.success("Categoría creada exitosamente");
      (e.target as HTMLFormElement).reset();
      fetchCategories();
    } else {
      toast.error(result.error || "Error al crear categoría");
    }

    setIsSubmitting(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateCategory(editingCategory.id, formData);

    if (result.success) {
      toast.success("Categoría actualizada correctamente");
      setEditingCategory(null);
      fetchCategories();
    } else {
      toast.error(result.error || "Error al actualizar categoría");
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Segura de eliminar la categoría "${name}"?`)) return;

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
        
        {/* Form Column - Crear */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-lilaPastel sticky top-6">
            <h3 className="text-xl font-bold text-berenjena mb-4 flex items-center gap-2">
              <PlusIcon size={24} className="text-terracota" />
              Nueva Categoría
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej. Graduación"
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Descripción</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Descripción opcional..."
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
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

        {/* List Column */}
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
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">Cargando categorías...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-gray-500">
                      <TagIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
                      <p>No hay categorías creadas todavía.</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className="hover:bg-cream/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-berenjena">{c.name}</p>
                        {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                      </td>
                      <td className="p-4 font-mono text-sm text-sage">{c.slug}</td>
                      <td className="p-4 flex justify-center gap-3">
                        <button
                          onClick={() => setEditingCategory(c)}
                          className="p-2 text-sage hover:bg-sage/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
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

      {/* Modal para Editar Categoría */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-berenjena/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-lilaPastel relative animate-fade-in-up">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-berenjena"
            >
              <XIcon size={20} weight="bold" />
            </button>

            <h3 className="text-xl font-bold text-berenjena mb-4">Editar Categoría</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCategory.name}
                  required
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Descripción</label>
                <textarea
                  name="description"
                  defaultValue={editingCategory.description || ""}
                  rows={3}
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="w-1/2 py-2.5 border border-lilaPastel rounded-lg text-berenjena font-bold hover:bg-cream"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-terracota text-white rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-70"
                >
                  {isSubmitting ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}