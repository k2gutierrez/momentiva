"use client";

import React, { useEffect, useState } from "react";
import { PlusIcon, TrashIcon, PowerIcon, InstagramLogoIcon, PlayCircleIcon, CopyIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { createInstagramPost, toggleInstagramPost, deleteInstagramPost } from "@/actions/instagram";
import { toast } from "sonner";

export default function AdminInstagramPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("instagram_feed")
      .select("*")
      .order("order_index", { ascending: true });

    if (data) setPosts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createInstagramPost(formData);

    if (result.success) {
      toast.success("Publicación agregada al feed");
      (e.target as HTMLFormElement).reset();
      fetchPosts();
    } else {
      toast.error(result.error || "Error al agregar publicación");
    }

    setIsSubmitting(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const result = await toggleInstagramPost(id, currentStatus);
    if (result.success) {
      toast.success(currentStatus ? "Publicación desactivada" : "Publicación activada");
      fetchPosts();
    } else {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Segura de eliminar esta publicación del feed?")) return;
    const result = await deleteInstagramPost(id);
    if (result.success) {
      toast.success("Publicación eliminada");
      fetchPosts();
    } else {
      toast.error("Error al eliminar publicación");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-berenjena flex items-center gap-2">
          <InstagramLogoIcon size={32} /> Feed de Instagram
        </h2>
        <p className="text-gray-500 mt-2">
          Administra las fotos y videos que aparecen en la sección "Inspírate con nuestras creaciones".
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-lilaPastel sticky top-6">
            <h3 className="text-xl font-bold text-berenjena mb-4 flex items-center gap-2">
              <PlusIcon size={24} className="text-terracota" />
              Nueva Publicación
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">URL de Instagram</label>
                <input
                  type="url"
                  name="postUrl"
                  required
                  placeholder="https://instagram.com/p/..."
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Orden de Aparición</label>
                <input
                  type="number"
                  name="orderIndex"
                  defaultValue={0}
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena text-sm"
                />
              </div>

              <div className="flex items-center gap-2 mt-2 bg-cream/50 p-3 rounded-lg border border-lilaPastel">
                <input 
                  type="checkbox" 
                  name="isVideo" 
                  id="isVideo"
                  className="w-4 h-4 text-terracota accent-terracota" 
                />
                <label htmlFor="isVideo" className="text-sm font-bold text-berenjena cursor-pointer">
                  Es un formato de Video (Reel)
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Captura de Pantalla / Foto</label>
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
                {isSubmitting ? "Subiendo..." : "Guardar Publicación"}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Publicaciones */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <p className="text-gray-500">Cargando publicaciones...</p>
          ) : posts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-lilaPastel text-gray-500">
              <InstagramLogoIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
              <p>No hay publicaciones agregadas al feed aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className={`bg-white rounded-xl border border-lilaPastel shadow-sm overflow-hidden flex flex-col relative group ${
                    !post.is_active ? "opacity-50 grayscale" : ""
                  }`}
                >
                  <div className="relative aspect-square bg-cream">
                    <img
                      src={post.image_url}
                      alt="Instagram Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 text-white drop-shadow-md">
                      {post.is_video ? <PlayCircleIcon size={20} weight="fill" /> : <CopyIcon size={20} weight="fill" />}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono bg-cream px-2 py-1 rounded text-sage font-bold w-full text-center truncate">
                      Orden: #{post.order_index}
                    </span>
                    
                    <div className="flex gap-2 w-full justify-center">
                      <button
                        onClick={() => handleToggle(post.id, post.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          post.is_active ? "text-red-400 hover:bg-red-50" : "text-green-500 hover:bg-green-50"
                        }`}
                        title={post.is_active ? "Desactivar" : "Activar"}
                      >
                        <PowerIcon size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}