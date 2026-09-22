"use client";

import React, { useEffect, useRef, useState } from "react";
import { CreditCardIcon, CircleNotchIcon, ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { pagarPedidoConTarjeta } from "@/actions/pagos";
import { CLAVE_PUBLICA_MERCADO_PAGO } from "@/lib/mercadoPagoPublica";

declare global {
  interface Window {
    MercadoPago?: new (clave: string, opciones?: { locale?: string }) => {
      bricks: () => {
        create: (
          tipo: string,
          contenedor: string,
          opciones: Record<string, unknown>
        ) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

/**
 * Formulario de tarjeta DENTRO de la tienda (Payment Brick de Mercado Pago).
 *
 * ⚠️ Deshabilitado por defecto: solo se muestra si está configurada
 * NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY. Sin la clave, el checkout sigue usando la
 * redirección de siempre (que funciona bien).
 *
 * Seguridad: los campos de tarjeta son de Mercado Pago (no nuestros), así que el
 * número de tarjeta nunca pasa por la tienda. Nosotros recibimos un token de un solo
 * uso y el monto se toma del pedido guardado en el servidor.
 */
export default function PagoConTarjeta({
  orderId,
  monto,
  correo,
  onPagoResuelto,
  onNoDisponible,
}: {
  orderId: string;
  monto: number;
  correo?: string;
  onPagoResuelto: (resultado: { status: string; statusDetail: string; paymentId: string }) => void;
  onNoDisponible: () => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Los callbacks se guardan en un ref: así el efecto NO se vuelve a ejecutar cuando
  // el padre se vuelve a dibujar (eso creaba un segundo formulario: se veía duplicado).
  const callbacks = useRef({ onPagoResuelto, onNoDisponible });
  callbacks.current = { onPagoResuelto, onNoDisponible };

  useEffect(() => {
    const clave = CLAVE_PUBLICA_MERCADO_PAGO;
    if (!clave) {
      callbacks.current.onNoDisponible();
      return;
    }

    let brick: { unmount: () => void } | null = null;
    let cancelado = false;

    const cargar = async () => {
      try {
        // El SDK se carga solo cuando hace falta (no pesa en el resto del sitio).
        if (!window.MercadoPago) {
          await new Promise<void>((resolver, rechazar) => {
            const script = document.createElement("script");
            script.src = "https://sdk.mercadopago.com/js/v2";
            script.async = true;
            script.onload = () => resolver();
            script.onerror = () => rechazar(new Error("No se pudo cargar el SDK"));
            document.head.appendChild(script);
          });
        }
        if (cancelado || !window.MercadoPago || !contenedor.current) return;

        const mp = new window.MercadoPago(clave, { locale: "es-MX" });
        brick = await mp.bricks().create("payment", "contenedor-pago-tarjeta", {
          initialization: {
            amount: Number(monto),
            payer: correo ? { email: correo } : undefined,
          },
          customization: {
            visual: {
              style: {
                theme: "default",
                customVariables: {
                  baseColor: "#C97B5F",
                  buttonTextColor: "#ffffff",
                  borderRadiusMedium: "12px",
                },
              },
            },
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              // Sin saldo de Mercado Pago: para eso está el botón de redirección.
              mercadoPago: "none",
            },
          },
          callbacks: {
            onReady: () => setCargando(false),
            onError: (e: unknown) => {
              console.error("[PagoBrick] error del componente:", e);
              setError("No se pudo cargar el formulario de tarjeta.");
              callbacks.current.onNoDisponible();
            },
            onSubmit: ({ formData }: { formData: Record<string, unknown> }) =>
              new Promise<void>((resolver, rechazar) => {
                pagarPedidoConTarjeta({
                  orderId,
                  token: String(formData.token || ""),
                  paymentMethodId: String(formData.payment_method_id || ""),
                  installments: Number(formData.installments) || 1,
                  issuerId: formData.issuer_id ? String(formData.issuer_id) : undefined,
                  payerEmail:
                    ((formData.payer as Record<string, unknown>)?.email as string) || correo,
                  identificacion: (formData.payer as Record<string, unknown>)?.identification as
                    | { type?: string; number?: string }
                    | undefined,
                })
                  .then((r) => {
                    if (r.ok) {
                      callbacks.current.onPagoResuelto({
                        status: r.status,
                        statusDetail: r.statusDetail || "",
                        paymentId: r.paymentId || "",
                      });
                      resolver();
                    } else {
                      setError(r.error || "No se pudo procesar el pago.");
                      rechazar(new Error(r.error || "Pago rechazado"));
                    }
                  })
                  .catch(() => {
                    setError("No se pudo conectar. Inténtalo de nuevo.");
                    rechazar(new Error("Error de conexión"));
                  });
              }),
          },
        });
      } catch (e) {
        console.error("[PagoBrick] no se pudo inicializar:", e);
        if (!cancelado) {
          setError("No se pudo cargar el formulario de tarjeta.");
          callbacks.current.onNoDisponible();
        }
      }
    };

    cargar();

    return () => {
      cancelado = true;
      try {
        brick?.unmount();
      } catch {
        /* ignorar */
      }
      // Se vacía el contenedor para que no queden formularios viejos dibujados
      if (contenedor.current) contenedor.current.innerHTML = "";
    };
  }, [orderId, monto, correo]);

  return (
    <div className="bg-white rounded-2xl border border-lilaPastel p-5">
      <h3 className="flex items-center gap-2 font-bold text-berenjena mb-4">
        <CreditCardIcon size={20} weight="bold" className="text-terracota" />
        Paga aquí con tu tarjeta
      </h3>

      {cargando && !error && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
          <CircleNotchIcon size={18} className="animate-spin text-terracota" />
          Preparando el formulario de pago…
        </div>
      )}

      {error && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-300 rounded-xl p-3 mb-3">
          {error}
        </div>
      )}

      <div id="contenedor-pago-tarjeta" ref={contenedor} />

      <button
        type="button"
        onClick={onNoDisponible}
        className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold text-berenjena hover:text-terracota"
      >
        <ArrowSquareOutIcon size={14} weight="bold" />
        Prefiero pagar con Mercado Pago (otra ventana)
      </button>

      <p className="text-[11px] text-gray-500 text-center mt-3 leading-relaxed">
        Tus datos de tarjeta los maneja Mercado Pago; la tienda nunca los ve.
      </p>
    </div>
  );
}
