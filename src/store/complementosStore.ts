import { atom } from "jotai";

/**
 * ¿El cliente quiere agregar un complemento a este producto?
 *
 * Vive en un átomo porque la pregunta se muestra dentro del formulario del
 * producto y el bloque de complementos está en otra sección de la página.
 * Arranca en `false`: si no dice que sí, los complementos no se muestran.
 */
export const quiereComplementosAtom = atom<boolean>(false);

/**
 * Fecha y hora de entrega elegidas en la ficha del producto.
 *
 * Los complementos se agregan desde la misma ficha, así que heredan esta entrega:
 * de lo contrario el checkout pediría fecha y hora para el complemento.
 */
export const entregaSeleccionadaAtom = atom<{ fecha: string; hora: string }>({
  fecha: "",
  hora: "",
});
