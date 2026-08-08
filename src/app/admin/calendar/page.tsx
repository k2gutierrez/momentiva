"use client";

import React, { useEffect, useState } from "react";
import { CalendarXIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { blockDate, unblockDate } from "@/actions/calendar";
import { toast } from "sonner";

export default function AdminCalendarPage() {
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlockedDates = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("blocked_dates")
      .select("*")
      .order("blocked_date", { ascending: true });

    if (data) setBlockedDates(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const handleBlockDate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await blockDate(formData);

    if (result.success) {
      toast.success("Fecha bloqueada exitosamente");
      (e.target as HTMLFormElement).reset();
      fetchBlockedDates();
    } else {
      toast.error(result.error || "Error al bloquear fecha");
    }

    setIsSubmitting(false);
  };

  const handleUnblock = async (id: string, dateStr: string) => {
    if (!window.confirm(`¿Deseas desbloquear la fecha ${dateStr}?`)) return;

    const result = await unblockDate(id);
    if (result.success) {
      toast.success("Fecha desbloqueada");
      fetchBlockedDates();
    } else {
      toast.error("Error al desbloquear la fecha");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-berenjena">Gestión de Calendario</h2>
        <p className="text-gray-500 mt-2">
          Bloquea los días en los que no habrá entregas o servicio disponible.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-lilaPastel sticky top-6">
            <h3 className="text-xl font-bold text-berenjena mb-4 flex items-center gap-2">
              <CalendarXIcon size={24} className="text-terracota" />
              Bloquear Día
            </h3>

            <form onSubmit={handleBlockDate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Fecha a Bloquear</label>
                <input
                  type="date"
                  name="blockedDate"
                  required
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Motivo (Opcional)</label>
                <input
                  type="text"
                  name="reason"
                  placeholder="Ej. Día festivo, cupo lleno..."
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white py-3 rounded-lg shadow-md transition-colors font-bold"
              >
                <PlusIcon size={18} weight="bold" />
                {isSubmitting ? "Bloqueando..." : "Bloquear Fecha"}
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
                  <th className="p-4 font-bold">Fecha Bloqueada</th>
                  <th className="p-4 font-bold">Motivo</th>
                  <th className="p-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-berenjena divide-y divide-lilaPastel/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">Cargando días bloqueados...</td>
                  </tr>
                ) : blockedDates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-gray-500">
                      <CalendarXIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
                      <p>No hay fechas bloqueadas actualmente.</p>
                    </td>
                  </tr>
                ) : (
                  blockedDates.map((item) => (
                    <tr key={item.id} className="hover:bg-cream/30 transition-colors group">
                      <td className="p-4 font-bold text-berenjena">
                        {new Date(item.blocked_date + "T00:00:00").toLocaleDateString("es-MX", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-gray-600">{item.reason || "Sin especificar"}</td>
                      <td className="p-4 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleUnblock(item.id, item.blocked_date)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Desbloquear"
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