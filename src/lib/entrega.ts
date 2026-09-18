// Reglas de entrega compartidas entre la ficha de producto y el checkout.
//
// Se centralizan aquí porque las usan dos pantallas y porque cambian con el
// negocio (hora de corte, horarios). Todo se calcula en hora LOCAL del visitante:
// el servidor corre en UTC y ahí "hoy" es distinto.

/** Hora de corte (24 h, hora local). A partir de aquí, la entrega inmediata pasa al día siguiente. */
export const HORA_CORTE_INMEDIATA = 13;

export const HORARIOS = [
  { value: "9:00 - 13:00", label: "9:00 am – 1:00 pm" },
  { value: "13:00 - 18:00", label: "1:00 pm – 6:00 pm" },
] as const;

/** Fecha local en formato YYYY-MM-DD (toISOString daría el día UTC y se recorre por la tarde). */
export function aIso(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function deIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function hoyIso(ahora: Date = new Date()): string {
  const d = new Date(ahora);
  d.setHours(0, 0, 0, 0);
  return aIso(d);
}

/** Un producto es de entrega inmediata cuando no requiere días de anticipación. */
export function esInmediato(anticipationDays?: number | null): boolean {
  return !anticipationDays || anticipationDays <= 0;
}

/**
 * Primer día que se puede elegir para un producto.
 * - Con anticipación: hoy + esos días.
 * - Inmediato antes de la hora de corte: hoy.
 * - Inmediato después de la hora de corte: mañana.
 */
export function primerDiaDisponible(
  anticipationDays: number,
  ahora: Date = new Date()
): Date {
  const dias = Math.max(0, anticipationDays || 0);
  let d = new Date(ahora);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dias);

  if (dias === 0 && ahora.getHours() >= HORA_CORTE_INMEDIATA) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/** ¿Este producto puede entregarse hoy mismo? (depende de la hora del pedido) */
export function puedeSerHoy(anticipationDays: number, ahora: Date = new Date()): boolean {
  return aIso(primerDiaDisponible(anticipationDays, ahora)) === hoyIso(ahora);
}

/**
 * Horarios válidos para una fecha concreta.
 * Un producto de entrega inmediata pedido por la mañana NO puede entregarse esa
 * misma mañana: solo queda el horario de la tarde.
 */
export function horariosDelDia(
  anticipationDays: number,
  fechaIso: string,
  ahora: Date = new Date()
): string[] {
  const todos = HORARIOS.map((h) => h.value);
  const esHoy = fechaIso === hoyIso(ahora);

  if (!esHoy) return todos;

  // Hoy: solo se permite el horario de la tarde si es entrega inmediata pedida por la mañana
  if (esInmediato(anticipationDays) && ahora.getHours() < HORA_CORTE_INMEDIATA) {
    return [HORARIOS[1].value];
  }
  return todos;
}

/** Hora de inicio de un bloque ("13:00 - 18:00" -> 13), para comparar horarios. */
export function inicioHorario(valor?: string | null): number {
  const n = Number(String(valor || "").split(":")[0]);
  return Number.isFinite(n) ? n : 0;
}

export interface ItemParaUnificar {
  productId: string;
  name: string;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
}

export interface InfoProducto {
  anticipationDays: number;
}

export interface DetalleEntrega {
  nombre: string;
  fecha: string;
  hora: string;
  inmediato: boolean;
  esLaMasLejana: boolean;
}

export interface EntregaUnificada {
  fecha: string;
  hora: string;
  /** Artículos que llegaron al checkout sin fecha elegida */
  sinFecha: string[];
  /** Los productos no coinciden en fecha u horario */
  hayDiferencia: boolean;
  /** Hay productos de entrega inmediata mezclados con otros que requieren días */
  mezclaInmediata: boolean;
  /** Hay que pedirle al cliente que acepte el ajuste antes de pagar */
  requiereAceptacion: boolean;
  detalle: DetalleEntrega[];
}

/**
 * Un pedido se entrega en UNA sola fecha y hora. Cuando los productos no
 * coinciden gana la más lejana: es la única que respeta el tiempo de
 * preparación de todos.
 */
export function unificarEntrega(
  items: ItemParaUnificar[],
  infoPorProducto: Record<string, InfoProducto | undefined>,
  ahora: Date = new Date()
): EntregaUnificada {
  const sinFecha = items.filter((i) => !i.deliveryDate).map((i) => i.name);
  const conFecha = items.filter((i) => Boolean(i.deliveryDate));

  if (conFecha.length === 0) {
    return {
      fecha: "",
      hora: "",
      sinFecha,
      hayDiferencia: false,
      mezclaInmediata: false,
      requiereAceptacion: false,
      detalle: [],
    };
  }

  const fechaGanadora = conFecha
    .map((i) => String(i.deliveryDate))
    .reduce((a, b) => (b > a ? b : a));

  // El horario más tardío de ese día (los bloques son "9:00 - 13:00" y "13:00 - 18:00")
  const horaGanadora = conFecha
    .map((i) => i.deliveryTime || "")
    .reduce((a, b) => (inicioHorario(b) > inicioHorario(a) ? b : a), "");

  const inmediatos = items.filter((i) => esInmediato(infoPorProducto[i.productId]?.anticipationDays));
  const conAnticipacion = items.filter(
    (i) => !esInmediato(infoPorProducto[i.productId]?.anticipationDays)
  );
  const mezclaInmediata = inmediatos.length > 0 && conAnticipacion.length > 0;

  const fechasDistintas = new Set(conFecha.map((i) => i.deliveryDate)).size > 1;
  const horasDistintas =
    new Set(conFecha.map((i) => i.deliveryTime || "").filter(Boolean)).size > 1;
  const hayDiferencia = fechasDistintas || horasDistintas;

  return {
    fecha: fechaGanadora,
    hora: horaGanadora,
    sinFecha,
    hayDiferencia,
    mezclaInmediata,
    requiereAceptacion: hayDiferencia || mezclaInmediata,
    detalle: conFecha.map((i) => ({
      nombre: i.name,
      fecha: String(i.deliveryDate),
      hora: i.deliveryTime || "",
      inmediato: esInmediato(infoPorProducto[i.productId]?.anticipationDays),
      esLaMasLejana: String(i.deliveryDate) === fechaGanadora,
    })),
  };
}

/** "2026-09-19" + "13:00 - 18:00" -> "sábado 19 de septiembre de 2026 · 1:00 pm – 6:00 pm" */
export function formatearEntrega(fecha: string, hora?: string): string {
  if (!fecha) return "";
  const larga = deIso(fecha).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const etiqueta = HORARIOS.find((h) => h.value === hora)?.label;
  return etiqueta ? `${larga} · ${etiqueta}` : larga;
}
