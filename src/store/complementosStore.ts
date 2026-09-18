import { atom } from "jotai";

/**
 * ¿El cliente quiere agregar un complemento a este producto?
 *
 * Vive en un átomo porque la pregunta se muestra dentro del formulario del
 * producto y el bloque de complementos está en otra sección de la página.
 * Arranca en `false`: si no dice que sí, los complementos no se muestran.
 */
export const quiereComplementosAtom = atom<boolean>(false);
