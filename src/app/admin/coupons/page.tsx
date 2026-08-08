"use client";

import React, { useEffect, useState } from "react";
import { TicketIcon, PlusIcon, PowerIcon, TrashIcon, PercentIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { createCoupon, toggleCouponStatus, deleteCoupon } from "@/actions/coupons";
import { toast } from "sonner";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCoupons(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createCoupon(formData);

    if (result.success) {
      toast.success("Cupón creado exitosamente");
      (e.target as HTMLFormElement).reset();
      fetchCoupons();
    } else {
      toast.error(result.error || "Error al crear el cupón");
    }

    setIsSubmitting(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const result = await toggleCouponStatus(id, currentStatus);
    if (result.success) {
      toast.success(currentStatus ? "Cupón desactivado" : "Cupón activado");
      fetchCoupons();
    } else {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`¿Segura de eliminar el cupón "${code}"?`)) return;

    const result = await deleteCoupon(id);
    if (result.success) {
      toast.success("Cupón eliminado");
      fetchCoupons();
    } else {
      toast.error("Error al eliminar el cupón");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-berenjena">Cupones y Descuentos</h2>
        <p className="text-gray-500 mt-2">Crea códigos promocionales para premiar a tus clientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-lilaPastel sticky top-6">
            <h3 className="text-xl font-bold text-berenjena mb-4 flex items-center gap-2">
              <TicketIcon size={24} className="text-terracota" />
              Nuevo Cupón
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Código del Cupón</label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="Ej. MOMENTIVA10"
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Tipo</label>
                  <select
                    name="discountType"
                    className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    name="discountValue"
                    required
                    placeholder="10"
                    className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Mín. Compra ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="minSpend"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Límite Usos</label>
                  <input
                    type="number"
                    name="maxUses"
                    placeholder="Ilimitado"
                    className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Fecha de Expiración</label>
                <input
                  type="date"
                  name="expiresAt"
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white py-3 rounded-lg shadow-md transition-colors font-bold"
              >
                <PlusIcon size={18} weight="bold" />
                {isSubmitting ? "Guardando..." : "Crear Cupón"}
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
                  <th className="p-4 font-bold">Código</th>
                  <th className="p-4 font-bold">Descuento</th>
                  <th className="p-4 font-bold">Usos</th>
                  <th className="p-4 font-bold">Expiración</th>
                  <th className="p-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-berenjena divide-y divide-lilaPastel/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Cargando cupones...</td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      <TicketIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
                      <p>No hay cupones de descuento creados aún.</p>
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} className={`hover:bg-cream/30 transition-colors group ${!c.is_active ? "opacity-50 grayscale" : ""}`}>
                      <td className="p-4 font-mono font-bold text-berenjena">{c.code}</td>
                      <td className="p-4 font-bold text-terracota">
                        {c.discount_type === "percentage" ? `${c.discount_value}%` : `$${c.discount_value.toFixed(2)}`}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {c.used_count || 0} / {c.max_uses ? c.max_uses : "∞"}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString("es-MX") : "Sin límite"}
                      </td>
                      <td className="p-4 flex justify-center gap-3">
                        <button
                          onClick={() => handleToggle(c.id, c.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            c.is_active ? "text-red-400 hover:bg-red-50" : "text-green-500 hover:bg-green-50"
                          }`}
                          title={c.is_active ? "Desactivar" : "Activar"}
                        >
                          <PowerIcon size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
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