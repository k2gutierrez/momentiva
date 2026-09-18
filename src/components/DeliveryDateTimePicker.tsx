"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { CalendarBlankIcon, ClockIcon, InfoIcon } from "@phosphor-icons/react/dist/ssr";
import {
  HORA_CORTE_INMEDIATA,
  HORARIOS,
  aIso,
  deIso,
  esInmediato,
  horariosDelDia,
  primerDiaDisponible,
} from "@/lib/entrega";

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
  // El calendario depende de "hoy" y de la zona horaria del visitante, que no es
  // la del servidor (Hostinger corre en UTC). Se dibuja solo en el navegador para
  // que el HTML del servidor y el del cliente coincidan (error de hidratación).
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const inmediato = esInmediato(anticipationDays);

  // Primer día disponible: hoy + anticipación, o mañana si es inmediato y ya pasó
  // la hora de corte (no da tiempo a prepararlo hoy).
  const fechaMinima = useMemo(
    () => primerDiaDisponible(anticipationDays),
    [anticipationDays]
  );
  const minDateIso = aIso(fechaMinima);

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

  // Horarios válidos para la fecha elegida: en entrega inmediata pedida por la
  // mañana, el horario de la mañana de hoy queda bloqueado.
  const horariosValidos = useMemo(
    () => (deliveryDate ? horariosDelDia(anticipationDays, deliveryDate) : []),
    [anticipationDays, deliveryDate]
  );

  // Si el horario elegido deja de ser válido (p. ej. cambió la fecha), se limpia
  useEffect(() => {
    if (deliveryTime && horariosValidos.length > 0 && !horariosValidos.includes(deliveryTime)) {
      onTimeChange("");
    }
  }, [deliveryTime, horariosValidos, onTimeChange]);

  const mesInicial = seleccionada ?? fechaMinima;
  const finDeRango = new Date(fechaMinima.getFullYear(), fechaMinima.getMonth() + 6, 1);
  const bloqueaMananaDeHoy =
    inmediato && Boolean(deliveryDate) && deliveryDate === aIso(new Date()) && new Date().getHours() < HORA_CORTE_INMEDIATA;

  return (
    <div className="bg-white/70 p-4 rounded-2xl space-y-4">
      <div className="flex items-center gap-2">
        <CalendarBlankIcon size={20} className="text-terracota" />
        <h4 className="text-sm font-bold text-[#3A243F] uppercase tracking-wider">
          Elige tu fecha y horario de entrega
        </h4>
      </div>

      {inmediato && (
        <div className="flex items-start gap-2 rounded-xl bg-sage/15 border border-sage/40 p-3">
          <InfoIcon size={18} weight="bold" className="text-sage mt-0.5 shrink-0" />
          <p className="text-xs text-[#3A243F] leading-relaxed">
            <span className="font-bold">Este producto es de entrega inmediata.</span>{" "}
            {new Date().getHours() < HORA_CORTE_INMEDIATA
              ? "Si lo pides ahora, se entrega hoy por la tarde (el horario de la mañana ya no alcanza)."
              : `Los pedidos después de la 1:00 pm se entregan a partir del día siguiente.`}
          </p>
        </div>
      )}

      {/* Calendario: los días no disponibles se ven atenuados y tachados */}
      <div>
        <label className="block text-xs font-bold text-[#3A243F] mb-2">
          Fecha de entrega <span className="text-terracota">*</span>
        </label>

        <div className="rounded-2xl border border-lilaPastel bg-white p-1 sm:p-3 flex justify-center overflow-x-auto min-h-[320px] items-center">
          {montado ? (
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
          ) : (
            <span className="text-xs text-gray-400 py-16">Cargando calendario…</span>
          )}
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

        {montado && !inmediato && anticipationDays > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Este producto se prepara con {anticipationDays} día(s) de anticipación,
            por eso el calendario inicia el{" "}
            {fechaMinima.toLocaleDateString("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        )}
      </div>

      {/* Bloques de horario */}
      <div>
        <label className="block text-xs font-bold text-[#3A243F] mb-1">
          Horario de entrega <span className="text-terracota">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {HORARIOS.map((slot) => {
            const disponible = horariosValidos.includes(slot.value);
            return (
              <button
                key={slot.value}
                type="button"
                disabled={!disponible}
                onClick={() => onTimeChange(slot.value)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  deliveryTime === slot.value
                    ? "bg-terracota text-white shadow-md"
                    : disponible
                      ? "bg-white text-[#3A243F] border border-lilaPastel hover:border-terracota"
                      : "bg-cream/60 text-gray-400 border border-dashed border-lilaPastel cursor-not-allowed line-through"
                }`}
              >
                <ClockIcon size={16} weight="bold" />
                {slot.label}
              </button>
            );
          })}
        </div>
        {bloqueaMananaDeHoy && (
          <p className="text-xs text-gray-500 mt-2">
            El horario de la mañana de hoy ya no está disponible para entrega inmediata.
            Puedes elegir la tarde de hoy o cualquier horario de otro día.
          </p>
        )}
        {!deliveryDate && (
          <p className="text-xs text-gray-500 mt-2">Primero elige una fecha.</p>
        )}
      </div>

      <p className="text-xs text-gray-500">
        La disponibilidad está sujeta a agenda; te confirmamos la entrega por WhatsApp.
      </p>
    </div>
  );
}
