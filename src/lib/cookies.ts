/**
 * Consentimiento de cookies.
 *
 * La tienda usa:
 * - Cookies NECESARIAS: sesión, carrito y el pago con Mercado Pago. Sin ellas no se
 *   puede comprar, así que no se pueden desactivar.
 * - Cookies de MEDICIÓN: el píxel de Meta (Facebook), que sirve para medir anuncios.
 *   Esas SOLO se activan si la clienta las acepta.
 *
 * Se guarda la decisión en el navegador (no vence) y se avisa a la tienda con un evento
 * para que el píxel se active en el momento en que acepta, sin recargar.
 */

export const CLAVE_CONSENTIMIENTO = "momentiva_consentimiento_cookies";
export const EVENTO_CONSENTIMIENTO = "momentiva:consentimiento";

export type DecisionCookies = "aceptado" | "solo_necesarias";

/** Lee la decisión guardada. `null` = todavía no ha elegido. */
export function leerConsentimiento(): DecisionCookies | null {
  if (typeof window === "undefined") return null;
  try {
    const valor = window.localStorage.getItem(CLAVE_CONSENTIMIENTO);
    return valor === "aceptado" || valor === "solo_necesarias" ? valor : null;
  } catch {
    return null;
  }
}

/** ¿Se permite la medición (píxel de Meta)? */
export function permiteMedicion(): boolean {
  return leerConsentimiento() === "aceptado";
}

/** Guarda la decisión y avisa a la tienda. */
export function guardarConsentimiento(decision: DecisionCookies) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE_CONSENTIMIENTO, decision);
  } catch {
    /* si el navegador bloquea el almacenamiento, se aplica solo en esta visita */
  }
  window.dispatchEvent(new CustomEvent(EVENTO_CONSENTIMIENTO, { detail: decision }));
}
