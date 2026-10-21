"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CookieIcon } from "@phosphor-icons/react/dist/ssr";
import {
  guardarConsentimiento,
  leerConsentimiento,
  type DecisionCookies,
} from "@/lib/cookies";

/**
 * Aviso de cookies.
 *
 * Aparece la primera vez que alguien entra a la tienda y hasta que elige. Las cookies
 * de medición (píxel de Meta) solo se activan si acepta; las necesarias (sesión,
 * carrito y pago) siempre funcionan porque sin ellas no se puede comprar.
 */
export default function ConsentimientoCookies() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Se revisa hasta que el navegador está listo para evitar parpadeos.
    if (leerConsentimiento() === null) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const decidir = (decision: DecisionCookies) => {
    guardarConsentimiento(decision);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 animate-fade-in-up"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-lilaPastel p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <CookieIcon size={26} weight="duotone" className="text-terracota shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-berenjena text-sm sm:text-base">
              Usamos cookies para que la tienda funcione y para medir nuestros anuncios
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-1">
              Las <strong>necesarias</strong> (carrito, sesión y pago) siempre están activas.
              Las de <strong>medición</strong> (Meta) solo se activan si nos das tu permiso.
              Más detalle en el{" "}
              <Link
                href="/aviso-de-privacidad"
                className="font-bold text-terracota underline hover:text-opacity-80"
              >
                aviso de privacidad
              </Link>
              .
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button
                type="button"
                onClick={() => decidir("aceptado")}
                className="flex-1 bg-berenjena hover:bg-opacity-90 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-colors"
              >
                Aceptar todas
              </button>
              <button
                type="button"
                onClick={() => decidir("solo_necesarias")}
                className="flex-1 bg-cream hover:bg-lilaPastel/40 text-berenjena font-bold text-sm py-2.5 px-4 rounded-xl border border-lilaPastel transition-colors"
              >
                Solo las necesarias
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
