"use client";

import React, { useEffect, useState } from "react";
import { MapPinIcon, PlusIcon, PowerIcon, TrashIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { createDeliveryZone, toggleDeliveryZoneStatus, deleteDeliveryZone } from "@/actions/deliveryZones";
import { toast } from "sonner";

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [filteredZones, setFilteredZones] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchZones = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .order("zip_code", { ascending: true });

    if (data) {
      setZones(data);
      setFilteredZones(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredZones(zones);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredZones(
        zones.filter(
          (z) =>
            z.zip_code.includes(lower) ||
            z.municipality.toLowerCase().includes(lower) ||
            z.zone_name.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchTerm, zones]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createDeliveryZone(formData);

    if (result.success) {
      toast.success("Zona de envío agregada exitosamente");
      (e.target as HTMLFormElement).reset();
      fetchZones();
    } else {
      toast.error(result.error || "Error al agregar zona de envío");
    }

    setIsSubmitting(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const result = await toggleDeliveryZoneStatus(id, currentStatus);
    if (result.success) {
      toast.success(currentStatus ? "Zona desactivada" : "Zona activada");
      fetchZones();
    } else {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (id: string, zipCode: string) => {
    if (!window.confirm(`¿Segura de eliminar el código postal ${zipCode}?`)) return;

    const result = await deleteDeliveryZone(id);
    if (result.success) {
      toast.success("Código postal eliminado");
      fetchZones();
    } else {
      toast.error("Error al eliminar la zona");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-berenjena">Zonas de Envío y Códigos Postales</h2>
        <p className="text-gray-500 mt-2">
          Administra las zonas con cobertura de entrega local en Guadalajara, Zapopan y Tlajomulco.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-lilaPastel sticky top-6">
            <h3 className="text-xl font-bold text-berenjena mb-4 flex items-center gap-2">
              <MapPinIcon size={24} className="text-terracota" />
              Nueva Zona de Envío
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Código Postal (5 dígitos)</label>
                <input
                  type="text"
                  name="zipCode"
                  maxLength={5}
                  required
                  placeholder="Ej. 44100"
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Municipio</label>
                <select
                  name="municipality"
                  required
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                >
                  <option value="Guadalajara">Guadalajara</option>
                  <option value="Zapopan">Zapopan</option>
                  <option value="Tlajomulco">Tlajomulco</option>
                  <option value="Tlaquepaque">Tlaquepaque</option>
                  <option value="Tonalá">Tonalá</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Nombre de la Colonia / Zona</label>
                <input
                  type="text"
                  name="zoneName"
                  required
                  placeholder="Ej. Colonia Americana / Providencia"
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Costo de Envío ($ MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  required
                  placeholder="Ej. 85.00"
                  className="w-full px-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white py-3 rounded-lg shadow-md transition-colors font-bold"
              >
                <PlusIcon size={18} weight="bold" />
                {isSubmitting ? "Guardando..." : "Agregar Zona"}
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
          
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-t-xl border border-lilaPastel border-b-0 flex items-center gap-3">
            <MagnifyingGlassIcon size={20} className="text-sage" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código postal, municipio o colonia..."
              className="w-full focus:outline-none text-berenjena placeholder-gray-400 bg-transparent"
            />
          </div>

          <div className="bg-white rounded-b-xl border border-lilaPastel overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream/50 text-berenjena text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">C.P.</th>
                  <th className="p-4 font-bold">Zona / Colonia</th>
                  <th className="p-4 font-bold">Municipio</th>
                  <th className="p-4 font-bold">Costo Envío</th>
                  <th className="p-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-berenjena divide-y divide-lilaPastel/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Cargando zonas de envío...</td>
                  </tr>
                ) : filteredZones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      <MapPinIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
                      <p>No se encontraron códigos postales registrados.</p>
                    </td>
                  </tr>
                ) : (
                  filteredZones.map((zone) => (
                    <tr
                      key={zone.id}
                      className={`hover:bg-cream/30 transition-colors group ${
                        !zone.is_active ? "opacity-50 grayscale" : ""
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-berenjena">{zone.zip_code}</td>
                      <td className="p-4 font-semibold">{zone.zone_name}</td>
                      <td className="p-4 text-sm text-gray-600">{zone.municipality}</td>
                      <td className="p-4 font-bold text-terracota">${zone.price.toFixed(2)}</td>
                      <td className="p-4 flex justify-center gap-3">
                        <button
                          onClick={() => handleToggle(zone.id, zone.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            zone.is_active ? "text-red-400 hover:bg-red-50" : "text-green-500 hover:bg-green-50"
                          }`}
                          title={zone.is_active ? "Desactivar envío" : "Activar envío"}
                        >
                          <PowerIcon size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id, zone.zip_code)}
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