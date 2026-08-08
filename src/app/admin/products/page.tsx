"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MagnifyingGlass, PencilSimple, Power, Package } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { toggleProductStatus } from "@/actions/products";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live data from Supabase
  const fetchProducts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleProductStatus(id, currentStatus);
    if (result.success) {
      toast.success(currentStatus ? "Producto deshabilitado" : "Producto habilitado");
      fetchProducts(); // Refresh the table
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