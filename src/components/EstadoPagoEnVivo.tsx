"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { consultarEstadoPago } from "@/actions/checkout";

type Estado = "pending" | "approved" | "rejected" | "refunded";

/**
 * Muestra el estado del pago y lo va revisando solo cada 5 segundos.
 *
 * Antes, la pantalla de "estamos confirmando tu pago" se quedaba congelada: si el
 * pago se aprobaba un minuto después, la clienta seguía viendo "en proceso" hasta
 * que recargara a mano (y probablemente pensara que algo salió mal).
 *
 * Ahora se actualiza sola y avisa cuando el pago queda aprobado.
 */
export default function EstadoPagoEnVivo({
  paymentId,
  estadoInicial = "pending",
}: {
  paymentId: string;
  estadoInicial?: string;
}) {
  const [estado, setEstado] = useState<Estado>(
    (["approved", "rejected", "refunded"].includes(estadoInicial)
      ? estadoInicial
      : "pending") as Estado
  );
  const [revisando, setRevisando] = useState(Boolean(paymentId));
  const [segundos, setSegundos] = useState(0);
  const [reintentos, setReintentos] = useState(0);

  useEffect(() => {
    if (!paymentId) {
      setRevisando(false);
      return;
    }

    let vivo = true;
    let intentos = 0;

    const revisar = async () => {
      intentos += 1;
      try {
        const r = await consultarEstadoPago(paymentId);
        if (!vivo) return;
        setReintentos(intentos);
        setSegundos(intentos * 5);
        const nuevo = (r?.status || "") as Estado;
        if (nuevo) setEstado(nuevo);
        if (["approved", "rejected", "refunded", "charged_back"].includes(nuevo)) {
          setRevisando(false);
          clearInterval(reloj);
        }
      } catch {
        // Si falla la consulta, se reintenta en el siguiente ciclo
      }
      if (intentos >= 36) {
        // ~3 minutos: si no se aclara, se deja de insistir y se avisa por WhatsApp
        setRevisando(false);
        clearInterval(reloj);
      }
    };

    const reloj = setInterval(revisar, 5000);
    revisar();

    return () => {
      vivo = false;
      clearInterval(reloj);
    };
  }, [paymentId]);

  const aprobado = estado === "approved";
  const rechazado = estado === "rejected" || estado === "refunded";

  return (
    <div className="flex-1 max-w-2xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center w-full">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          aprobado ? "bg-sage/20 text-sage" : rechazado ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
        }`}
      >
        {aprobado ? (
          <CheckCircleIcon size={48} weight="fill" />
        ) : rechazado ? (
          <XCircleIcon size={48} weight="fill" />
        ) : (
          <ClockIcon size={48} weight="bold" />
        )}
      </div>

      <h2 className="text-3xl md:text-4xl font-bold text-berenjena mb-3">
        {aprobado
          ? "¡Pago aprobado! 🎉"
          : rechazado
          ? "No se pudo completar el pago"
          : "Estamos confirmando tu pago…"}
      </h2>

      <p className="text-gray-600 text-lg mb-8 leading-relaxed">
        {aprobado
          ? "¡Muchas gracias por tu compra! Recibimos tu pedido y tu pago. Nos pondremos en contacto por WhatsApp para coordinar la entrega."
          : rechazado
          ? "Tu pedido quedó guardado como pendiente de pago. Puedes volver a intentarlo o escribirnos por WhatsApp y con gusto te ayudamos."
          : "Tu pago está en proceso de acreditación. Esta pantalla se actualiza sola: en cuanto Mercado Pago lo confirme, lo verás aquí mismo."}
      </p>

      {revisando && !aprobado && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <CircleNotchIcon size={18} className="animate-spin text-terracota" />
          Revisando… {reintentos > 0 && <span>({segundos}s)</span>}
        </div>
      )}

      {!revisando && !aprobado && !rechazado && paymentId && (
        <p className="text-sm text-gray-500 mb-8">
          El pago todavía no se acredita (es normal en pagos en OXXO o transferencia).
          Te avisaremos por WhatsApp en cuanto se confirme.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/mi-cuenta"
          className="bg-terracota hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          Ver mis pedidos
        </Link>
        <Link
          href="/tienda"
          className="bg-white text-berenjena font-bold px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          Seguir explorando
        </Link>
      </div>
    </div>
  );
}
