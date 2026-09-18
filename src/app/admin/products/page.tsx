"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MagnifyingGlass, PencilSimple, Power, Package, Copy } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { toggleProductStatus, duplicateProduct } from "@/actions/products";
import { toast } from "sonner";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  is_in_stock_item: boolean;
  stock_quantity: number;
  images: string[] | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleDuplicate = async (id: string) => {
    const result = await duplicateProduct(id);
    if (result.success && result.newId) {
      toast.success("Producto duplicado. Editando la copia...");
      router.push(`/admin/products/edit/${result.newId}`);
    } else {
      toast.error(result.error || "No se pudo duplicar el producto");
    }
  };

  const loadProducts = async (): Promise<ProductRow[]> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      // Columnas explícitas: `raw_cost` (costo interno) no es legible por usuarios
      .select("id, name, slug, description, price, images, category_id, custom_options, is_in_stock_item, stock_quantity, anticipation_days, is_custom_cup, is_active, created_at")
      .order("created_at", { ascending: false });

    return data ?? [];
  };

  const refreshProducts = async () => {
    setProducts(await loadProducts());
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setProducts(await loadProducts());
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleProductStatus(id, currentStatus);
    if (result.success) {
      toast.success(currentStatus ? "Producto deshabilitado" : "Producto habilitado");
      refreshProducts(); // Refresh the table
    } else {
      toast.error("Error al actualizar el estado");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-berenjena">Inventario de Productos</h2>
        <Link href="/admin/products/new" className="flex items-center gap-2 bg-terracota hover:bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-bold">
          <Plus size={20} weight="bold" /> Nuevo Producto
        </Link>
      </div>

      {/* Ayuda: dónde se muestran los complementos */}
      <div className="mb-6 p-4 rounded-xl bg-lilaPastel/25 text-sm text-gray-700">
        <p className="font-bold text-berenjena mb-1">💡 ¿Dónde agrego los complementos?</p>
        <p>
          Crea primero la categoría <strong>&ldquo;Complementa tu regalo&rdquo;</strong> en{" "}
          <Link href="/admin/categories" className="font-bold text-terracota hover:underline">Categorías</Link>{" "}
          (slug: <span className="font-mono">complementa-tu-regalo</span>) y luego crea aquí los productos
          (Suculentas, Cervezas, Pastel, Copa de postre, Charcutería…) asignándolos a esa categoría.
          Aparecerán automáticamente en la sección &ldquo;Complementa tu regalo&rdquo; de cada producto.
        </p>
        <p className="mt-1">
          Usa el botón <strong>Duplicar</strong> (⧉) para copiar un producto existente y editar solo los detalles.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-lilaPastel overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream/50 text-berenjena text-sm uppercase tracking-wider">
              <th className="p-4 font-bold">Producto</th>
              <th className="p-4 font-bold">Precio</th>
              <th className="p-4 font-bold">Inventario</th>
              <th className="p-4 font-bold">Estado</th>
              <th className="p-4 font-bold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-berenjena divide-y divide-lilaPastel/50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando productos...</td></tr>
            ) : products.map((product) => (
              <tr key={product.id} className={`hover:bg-cream/30 transition-colors group ${!product.is_active ? 'opacity-50 grayscale' : ''}`}>
                <td className="p-4 font-semibold flex items-center gap-3">
                  {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded-md border border-lilaPastel" />}
                  {product.name}
                </td>
                <td className="p-4">${product.price.toFixed(2)}</td>
                <td className="p-4">
                  {product.is_in_stock_item ? (
                    <span className="bg-sage/20 text-sage px-3 py-1 rounded-full text-xs font-bold">{product.stock_quantity} en stock</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">Bajo pedido</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4 flex justify-center gap-3">
                  <Link href={`/admin/products/edit/${product.id}`} className="p-2 text-sage hover:bg-sage/10 rounded-lg transition-colors" title="Editar">
                    <PencilSimple size={20} />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(product.id)}
                    className="p-2 text-berenjena hover:bg-cream rounded-lg transition-colors"
                    title="Duplicar producto (crea una copia inactiva para editar)"
                  >
                    <Copy size={20} />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(product.id, product.is_active)}
                    className={`p-2 rounded-lg transition-colors ${product.is_active ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`} 
                    title={product.is_active ? "Deshabilitar" : "Habilitar"}
                  >
                    <Power size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}