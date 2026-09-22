"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChartLineUpIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";

interface Pedido {
  id: string;
  created_at: string;
  status: string;
  payment_status: string | null;
  total_amount: number;
}

/**
 * Embudo de pagos: cuánta gente llega a pagar y cuánta no completa.
 *
 * Cómo se mide (sin inventar datos): cada vez que alguien toca "Pagar con Mercado
 * Pago" se crea un pedido. Si el pago no se completa, ese pedido queda "pendiente".
 * Así que comparando pedidos creados contra pedidos pagados sabemos exactamente
 * cuántos llegan al pago y no lo terminan.
 */
export default function EmbudoPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dias, setDias] = useState(30);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const supabase = createClient();
      const desde = new Date();
      desde.setDate(desde.getDate() - dias);

      const { data } = await supabase
        .from("orders")
        .select("id, created_at, status, payment_status, total_amount")
        .gte("created_at", desde.toISOString())
        .order("created_at", { ascending: false });

      setPedidos((data as Pedido[]) || []);
      setCargando(false);
    };
    cargar();
  }, [dias]);

  const pagados = pedidos.filter(
    (p) => p.payment_status === "paid" || p.payment_status === "refunded"
  );
  const pendientes = pedidos.filter((p) => !p.payment_status || p.payment_status === "pending");
  const rechazados = pedidos.filter((p) => p.payment_status === "rejected");

  const tasa = pedidos.length > 0 ? Math.round((pagados.length / pedidos.length) * 100) : 0;
  const dineroNoCobrado = pendientes.reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const dineroCobrado = pagados.reduce((s, p) => s + Number(p.total_amount || 0), 0);

  // Detalle por día (últimos 14)
  const porDia = new Map<string, { creados: number; pagados: number }>();
  pedidos.forEach((p) => {
    const dia = p.created_at.slice(0, 10);
    const actual = porDia.get(dia) || { creados: 0, pagados: 0 };
    actual.creados += 1;
    if (p.payment_status === "paid" || p.payment_status === "refunded") actual.pagados += 1;
    porDia.set(dia, actual);
  });
  const filas = [...porDia.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-bold text-berenjena hover:text-terracota mb-6"
      >
        <ArrowLeftIcon size={16} weight="bold" /> Volver al panel
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-berenjena flex items-center gap-3">
            <ChartLineUpIcon size={32} weight="bold" className="text-terracota" />
            Conversión de pagos
          </h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Cuánta gente llega a pagar y cuánta no termina la compra. Cada vez que alguien
            toca <strong>«Pagar con Mercado Pago»</strong> se crea un pedido: si el pago no
            se completa, ese pedido queda pendiente.
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                dias === d ? "bg-terracota text-white" : "bg-white text-berenjena hover:bg-cream"
              }`}
            >
              {d} días
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando…</p>
      ) : (
        <>
          {/* Tarjetas principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-lilaPastel">
              <p className="text-sm text-gray-500 font-bold">Llegaron a pagar</p>
              <p className="text-3xl font-bold text-berenjena mt-1">{pedidos.length}</p>
              <p className="text-xs text-gray-400 mt-1">pedidos creados</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-lilaPastel">
              <p className="text-sm text-gray-500 font-bold flex items-center gap-1">
                <CheckCircleIcon size={16} weight="fill" className="text-sage" /> Pagaron
              </p>
              <p className="text-3xl font-bold text-sage mt-1">{pagados.length}</p>
              <p className="text-xs text-gray-400 mt-1">${dineroCobrado.toFixed(2)} cobrados</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-lilaPastel">
              <p className="text-sm text-gray-500 font-bold flex items-center gap-1">
                <XCircleIcon size={16} weight="fill" className="text-amber-500" /> No completaron
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{pendientes.length}</p>
              <p className="text-xs text-gray-400 mt-1">
                {rechazados.length} rechazados por el banco
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-lilaPastel">
              <p className="text-sm text-gray-500 font-bold">Tasa de conversión</p>
              <p className="text-3xl font-bold text-berenjena mt-1">{tasa}%</p>
              <p className="text-xs text-gray-400 mt-1">
                <CurrencyDollarIcon size={12} className="inline" /> $
                {dineroNoCobrado.toFixed(2)} sin cobrar
              </p>
            </div>
          </div>

          {/* Detalle por día */}
          <div className="bg-white rounded-2xl shadow-sm border border-lilaPastel overflow-hidden">
            <div className="px-6 py-4 border-b border-lilaPastel bg-cream/40">
              <h2 className="font-bold text-berenjena">Día por día (últimos 14)</h2>
            </div>
            {filas.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm">
                Todavía no hay pedidos en este periodo.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-cream/30 text-gray-500">
                  <tr>
                    <th className="text-left px-6 py-3 font-bold">Fecha</th>
                    <th className="text-right px-6 py-3 font-bold">Llegaron a pagar</th>
                    <th className="text-right px-6 py-3 font-bold">Pagaron</th>
                    <th className="text-right px-6 py-3 font-bold">No completaron</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map(([dia, v]) => (
                    <tr key={dia} className="border-t border-lilaPastel/60">
                      <td className="px-6 py-3 text-berenjena">
                        {new Date(`${dia}T12:00:00`).toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-6 py-3 text-right font-bold">{v.creados}</td>
                      <td className="px-6 py-3 text-right font-bold text-sage">{v.pagados}</td>
                      <td className="px-6 py-3 text-right font-bold text-amber-600">
                        {v.creados - v.pagados}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-6 leading-relaxed">
            <strong>Nota:</strong> aquí se cuentan los pedidos creados. Si alguien llena sus
            datos y cierra la página <em>antes</em> de tocar «Pagar», no aparece en este
            reporte (más adelante se puede medir también ese paso).
          </p>
        </>
      )}
    </div>
  );
}
