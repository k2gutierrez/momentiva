"use client";

import React from "react";
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

export default function DeliveryDateTimePicker({
  anticipationDays,
  blockedDates,
  deliveryDate,
  deliveryTime,
  onDateChange,
  onTimeChange,
}: DeliveryDateTimePickerProps) {
  // Fecha mínima = hoy + días de anticipación del producto
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + (anticipationDays || 0));
  const minDateIso = minDate.toISOString().split("T")[0];

  const isBlocked = blockedDates.includes(deliveryDate);

  return (
    <div className="bg-white/70 p-4 rounded-2xl space-y-4">
      <div className="flex items-center gap-2">
        <CalendarBlankIcon size={20} className="text-terracota" />
        <h4 className="text-sm font-bold text-[#3A243F] uppercase tracking-wider">
          Elige tu fecha y horario de entrega
        </h4>
      </div>

      {/* Selector de fecha */}
      <div>
        <label className="block text-xs font-bold text-[#3A243F] mb-1">
          Fecha de entrega <span className="text-terracota">*</span>
        </label>
        <input
          type="date"
          required
          min={minDateIso}
          value={deliveryDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-lilaPastel bg-white focus:outline-none focus:border-terracota text-sm text-gray-700"
        />
        {isBlocked && (
          <p className="text-xs font-bold text-red-500 mt-1">
            Esa fecha no está disponible para entregas. Por favor elige otro día.
          </p>
        )}
        {anticipationDays > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Este producto se prepara con {anticipationDays} día(s) de anticipación.
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
