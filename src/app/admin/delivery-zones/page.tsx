"use client";

import React, { useState, useEffect } from "react";
import { UploadSimpleIcon, DownloadSimpleIcon, MapPinIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { bulkUpsertDeliveryZones } from "@/actions/deliveryZones";
import { toast } from "sonner";

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchZones = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("delivery_zones")
      .select("*")
      .order("municipality", { ascending: true })
      .order("zip_code", { ascending: true });

    if (data) setZones(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Descargar la plantilla CSV
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Codigo Postal,Municipio,Costo\n45010,Zapopan,150\n44100,Guadalajara,100\n45640,Tlajomulco,200";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_zonas_momentiva.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manejar la subida del archivo CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Procesando archivo...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        
        const parsedZones = [];
        
        // Saltamos la línea 0 que son los encabezados (Codigo Postal,Municipio,Costo)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const [zip_code, municipality, cost] = line.split(",");
          
          if (zip_code && municipality && cost) {
            parsedZones.push({
              zip_code: zip_code.trim(),
              municipality: municipality.trim(),
              delivery_cost: parseFloat(cost.trim()),
              is_available: true
            });
          }
        }

        if (parsedZones.length === 0) {
          throw new Error("El archivo está vacío o no tiene el formato correcto.");
        }

        // Mandamos el arreglo a Supabase
        const result = await bulkUpsertDeliveryZones(parsedZones);

        if (result.success) {
          toast.success(`¡Se registraron/actualizaron ${result.count} zonas correctamente!`);
          fetchZones();
        } else {
          toast.error("Error al guardar en base de datos: " + result.error);
        }
      } catch (error: any) {
        toast.error("Error leyendo el archivo: " + error.message);
      } finally {
        setIsUploading(false);
        // Reseteamos el input para que puedan subir el mismo archivo si lo corrigen
        e.target.value = ""; 
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-berenjena flex items-center gap-2">
          <MapPinIcon size={32} /> Zonas de Envío
        </h2>
        <p className="text-gray-500 mt-2">
          Administra los códigos postales y costos de envío. Usa la carga masiva para ahorrar tiempo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Carga Masiva */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-lilaPastel sticky top-6">
            <h3 className="text-xl font-bold text-berenjena mb-4">Carga Masiva (CSV)</h3>
            
            <p className="text-sm text-gray-500 mb-6">
              Sube un archivo de Excel guardado como <strong>.csv (Valores separados por comas)</strong> para registrar cientos de códigos postales en un segundo.
            </p>

            <button 
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 bg-cream text-[#3A243F] border border-lilaPastel hover:border-terracota font-bold py-3 rounded-lg transition-colors mb-4"
            >
              <DownloadSimpleIcon size={20} /> Descargar Plantilla
            </button>

            <label className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-lg shadow-md transition-colors cursor-pointer ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-terracota hover:bg-opacity-90 text-white'}`}>
              <UploadSimpleIcon size={20} />
              {isUploading ? "Procesando..." : "Subir Archivo CSV"}
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Columna Derecha: Lista de Zonas Activas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-lilaPastel overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream/50 text-berenjena text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">C.P.</th>
                  <th className="p-4 font-bold">Municipio</th>
                  <th className="p-4 font-bold text-right">Costo Envío</th>
                </tr>
              </thead>
              <tbody className="text-berenjena divide-y divide-lilaPastel/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">Cargando zonas...</td>
                  </tr>
                ) : zones.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-gray-500">
                      <MapPinIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
                      <p>No hay códigos postales registrados.</p>
                    </td>
                  </tr>
                ) : (
                  zones.map((z) => (
                    <tr key={z.id} className="hover:bg-cream/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-sage">{z.zip_code}</td>
                      <td className="p-4 font-bold">{z.municipality}</td>
                      <td className="p-4 text-right font-bold text-terracota">
                        ${z.delivery_cost.toFixed(2)}
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