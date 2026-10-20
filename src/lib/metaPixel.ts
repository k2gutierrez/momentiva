/**
 * Ayudante del Píxel de Meta (Facebook).
 *
 * El píxel mide la actividad de la tienda (visitas, productos vistos, compras) para
 * que las campañas de Meta puedan optimizarse y medir conversiones.
 *
 * El identificador del píxel es PÚBLICO (va en el navegador de cada visitante). Se puede
 * sobreescribir con la variable NEXT_PUBLIC_META_PIXEL_ID en Hostinger.
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1572455577967669";

type ParametrosMeta = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Envía un evento al píxel. Si el píxel no está cargado (o el visitante tiene un
 * bloqueador de anuncios), no falla nada: simplemente no se registra.
 */
export function metaTrack(evento: string, parametros?: ParametrosMeta, eventId?: string) {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;

  if (eventId) {
    fbq("track", evento, parametros || {}, { eventID: eventId });
  } else {
    fbq("track", evento, parametros || {});
  }
}

/** Redondea a 2 decimales para que Meta reciba valores limpios. */
export function montoMeta(valor: number): number {
  return Math.round(Number(valor || 0) * 100) / 100;
}
