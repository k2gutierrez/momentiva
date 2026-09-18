"use client";

import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { quiereComplementosAtom } from "@/store/complementosStore";

/**
 * Muestra el bloque de complementos solo si el cliente lo pidió en el formulario
 * del producto ("¿Quieres agregar un complemento?" -> Sí).
 *
 * Recibe el contenido ya renderizado en el servidor como children, así no hay
 * que duplicar consultas ni mover la lógica de datos al navegador.
 */
export default function ComplementosSeccion({
  children,
  clave,
}: {
  children: React.ReactNode;
  /** Identificador del producto: al cambiar de ficha se reinicia la elección. */
  clave: string;
}) {
  const [quiereComplementos, setQuiereComplementos] = useAtom(quiereComplementosAtom);

  // Al abrir otra ficha, la pregunta vuelve a "no" para no arrastrar la elección
  useEffect(() => {
    setQuiereComplementos(false);
  }, [clave, setQuiereComplementos]);

  if (!quiereComplementos) return null;

  return <div className="animate-fade-in-up">{children}</div>;
}
