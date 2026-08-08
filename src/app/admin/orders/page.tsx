"use client";

import React, { useEffect, useState } from "react";
import { ClipboardTextIcon, PlusIcon, CheckCircleIcon, ClockIcon, TruckIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus, createOfflineSale } from "@/actions/orders";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      toast.success("Estado de orden actualizado");
      fetchOrders();
    } else {
      toast.error("Error al actualizar el estado");
    }
  };

  const handleOfflineSaleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createOfflineSale(formData);

    if (result.success) {
      toast.success("Venta externa registrada correctamente");
      setIsModalOpen(false);
      (e.target as HTMLFormElement).reset();
      fetchOrders();
    } else {
      toast.error(result.error || "Error al registrar la venta");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="animate-fade-in-up">
      
      {/* Header & Offline Sale Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-berenjena">Panel de Órdenes en Vivo</h2>
          <p className="text-gray-500 mt-1">Supervisa el estado de producción y entrega de cada momento[cite: 1].</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-terracota hover:bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-bold"
        >
          <PlusIcon size={20} weight="bold" />
          Registrar Venta Externa
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-lilaPastel overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream/50 text-berenjena text-sm uppercase tracking-wider">
              <th className="p-4 font-bold">ID / Tipo</th>
              <th className="p-4 font-bold">Cliente</th>
              <th className="p-4 font-bold">Total / Margen</th>
              <th className="p-4 font-bold">Fecha de Entrega</th>
              <th className="p-4 font-bold">Estado Actual[cite: 1]</th>
            </tr>
          </thead>
          <tbody className="text-berenjena divide-y divide-lilaPastel/50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando órdenes...</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  <ClipboardTextIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
                  <p>No hay órdenes registradas todavía.</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const margin = order.total_amount - order.total_cost;
                const marginPercentage = order.total_amount > 0 ? ((margin / order.total_amount) * 100).toFixed(1) : 0;

                return (
                  <tr key={order.id} className="hover:bg-cream/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-berenjena text-sm">#{order.id.slice(0, 8)}</div>
                      {order.is_offline_sale ? (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-bold">Venta Externa</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold">Web</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold">{order.profiles?.full_name || order.delivery_address?.customer_name || "Cliente General"}</div>
                      <div className="text-xs text-gray-500">{order.profiles?.email || "Venta mostrador / offline"}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-terracota">${order.total_amount.toFixed(2)}</div>
                      <div className="text-xs text-sage font-semibold">Margen: ${margin.toFixed(2)} ({marginPercentage}%)[cite: 1]</div>
                    </td>
                    <td className="p-4 text-sm font-medium">{order.delivery_date}</td>
                    <td className="p-4">
                      {/* Status Dropdown selector[cite: 1] */}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-terracota ${
                          order.status === 'placed' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          order.status === 'work_in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.status === 'finish' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        <option value="placed">Recibida (Placed)</option>
                        <option value="work_in_progress">En proceso (Work in Progress)</option>
                        <option value="finish">Terminada (Finish)</option>
                        <option value="delivered">Entregada (Delivered)</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal to Register Offline Sale[cite: 1] */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-berenjena/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-lilaPastel p-8 animate-fade-in-up">
            <h3 className="text-2xl font-bold text-berenjena mb-4 flex items-center gap-2">
              <StorefrontIcon size={24} className="text-terracota" />
              Registrar Venta Externa (Offline)
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Ingresa los datos de una venta hecha fuera de la web para mantener el inventario y los márgenes financieros actualizados[cite: 1].
            </p>

            <form onSubmit={handleOfflineSaleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Nombre del Cliente</label>
                <input type="text" name="customerName" required className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-cream/30 text-berenjena focus:ring-2 focus:ring-terracota" placeholder="Nombre completo" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Ingreso Total ($)</label>
                  <input type="number" step="0.01" name="totalAmount" required className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-cream/30 text-berenjena focus:ring-2 focus:ring-terracota" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Costo Bruto ($)[cite: 1]</label>
                  <input type="number" step="0.01" name="totalCost" required className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-cream/30 text-berenjena focus:ring-2 focus:ring-terracota" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Fecha de Entrega</label>
                <input type="date" name="deliveryDate" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-cream/30 text-berenjena focus:ring-2 focus:ring-terracota" />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Notas / Especificaciones</label>
                <textarea name="notes" rows={2} className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-cream/30 text-berenjena focus:ring-2 focus:ring-terracota" placeholder="Detalles del producto vendido..."></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-lilaPastel">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 font-bold text-gray-500 hover:text-berenjena">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white font-bold px-6 py-2 rounded-lg shadow-md transition-colors">
                  {isSubmitting ? "Registrando..." : "Guardar Venta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}