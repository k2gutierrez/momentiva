"use client";

import React, { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { CalendarBlankIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";

const TIME_SLOTS = [
  { value: "9:00 - 13:00", label: "9:00 am – 1:00 pm" },
  { value: "13:00 - 18:00", label: "1:00 pm – 6:00 pm" },
];

interface DeliveryDateTimePickerProps {
  anticipationDays: number;
  blockedDates: string[];
  deliveryDate: string;
  deliveryTime: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

// Fechas en horario LOCAL. Con toISOString() (UTC) el día se recorre después de
// las 18:00 en México, y el cliente no podía elegir el día de hoy.
function aIso(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function deIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export default function DeliveryDateTimePicker({
  anticipationDays,
  blockedDates,
  deliveryDate,
  deliveryTime,
  onDateChange,
  onTimeChange,
}: DeliveryDateTimePickerProps) {
  // Primer día disponible = hoy + días de anticipación del producto (a medianoche local)
  const fechaMinima = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + (anticipationDays || 0));
    return d;
  }, [anticipationDays]);

  const bloqueadas = useMemo(
    () => new Set(blockedDates.filter(Boolean)),
    [blockedDates]
  );

  // Día no disponible: antes de la fecha mínima o marcado en el panel
  const noDisponible = (dia: Date) => {
    const d = new Date(dia);
    d.setHours(0, 0, 0, 0);
    return d < fechaMinima || bloqueadas.has(aIso(d));
  };

  const seleccionada = deliveryDate ? deIso(deliveryDate) : undefined;
  const esBloqueada = Boolean(deliveryDate) && bloqueadas.has(deliveryDate);

  // Abrimos el calendario en el mes de la fecha elegida (o en el primer día disponible)
  const mesInicial = seleccionada ?? fechaMinima;
  const finDeRango = new Date(fechaMinima.getFullYear(), fechaMinima.getMonth() + 6, 1);

  return (
    <div className="bg-white/70 p-4 rounded-2xl space-y-4">
      <div className="flex items-center gap-2">
        <CalendarBlankIcon size={20} className="text-terracota" />
        <h4 className="text-sm font-bold text-[#3A243F] uppercase tracking-wider">
          Elige tu fecha y horario de entrega
        </h4>
      </div>

      {/* Calendario: los días no disponibles se ven atenuados y tachados */}
      <div>
        <label className="block text-xs font-bold text-[#3A243F] mb-2">
          Fecha de entrega <span className="text-terracota">*</span>
        </label>

        <div className="rounded-2xl border border-lilaPastel bg-white p-1 sm:p-3 flex justify-center overflow-x-auto">
          <DayPicker
            className="rdp-momentiva"
            mode="single"
            locale={es}
            weekStartsOn={1}
            selected={seleccionada}
            onSelect={(dia) => onDateChange(dia ? aIso(dia) : "")}
            disabled={noDisponible}
            defaultMonth={mesInicial}
            startMonth={fechaMinima}
            endMonth={finDeRango}
            showOutsideDays
          />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Los días <span className="font-bold">tachados en gris</span> no están
          disponibles para entrega.
        </p>

        {esBloqueada && (
          <p className="text-xs font-bold text-red-500 mt-1">
            Esa fecha no está disponible para entregas. Por favor elige otro día.
          </p>
        )}

        {anticipationDays > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Este producto se prepara con {anticipationDays} día(s) de anticipación,
            por eso el calendario inicia el {aIso(fechaMinima)}.
          </p>
        )}
      </div>

      {/* Bloques de horario */}
      <div>
        <label className="block text-xs font-bold text-[#3A243F] mb-1">
          Horario de entrega <span className="text-terracota">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => onTimeChange(slot.value)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                deliveryTime === slot.value
                  ? "bg-terracota text-white shadow-md"
                  : "bg-white text-[#3A243F] border border-lilaPastel hover:border-terracota"
              }`}
            >
              <ClockIcon size={16} weight="bold" />
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        La disponibilidad está sujeta a agenda; te confirmamos la entrega por WhatsApp.
      </p>
    </div>
  );
}
