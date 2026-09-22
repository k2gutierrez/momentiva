/**
 * Llave PÚBLICA de Mercado Pago.
 *
 * ⚠️ Esta llave **es pública por diseño**: es la que va en el navegador de las
 * clientas para mostrar el formulario de tarjeta. No da acceso a nada (la llave
 * secreta es el Access Token, que vive en Hostinger y nunca se comparte).
 *
 * ¿Por qué está aquí además de en Hostinger?
 * Las variables `NEXT_PUBLIC_*` se "hornean" en el momento de construir la tienda.
 * Si el servidor donde se construye no las tiene disponibles, el pago con tarjeta
 * quedaría desactivado sin que nadie se diera cuenta. Con este respaldo funciona
 * igual, y si algún día se configura la variable en Hostinger, esa manda.
 *
 * Para cambiarla: basta editar la variable de entorno (tiene prioridad) o esta línea.
 */
export const CLAVE_PUBLICA_MERCADO_PAGO =
  process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
  "APP_USR-cd82861e-751f-4f13-8681-e05806f60b9a";
