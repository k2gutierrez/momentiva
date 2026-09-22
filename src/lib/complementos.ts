/**
 * Categoría de complementos ("Complementa tu regalo").
 *
 * Los productos de esta categoría NO son un catálogo aparte: solo se ofrecen
 * dentro de los productos que sí aceptan complementos. Por eso hay que excluirlos
 * del inicio, de la tienda y de las pills de categorías.
 */
export const SLUG_COMPLEMENTOS = "complementa-tu-regalo";

export function esCategoriaComplementos(
  slug?: string | null,
  name?: string | null
): boolean {
  const s = String(slug ?? "").toLowerCase();
  const n = String(name ?? "").toLowerCase();
  return s === SLUG_COMPLEMENTOS || s.includes("complement") || n.includes("complementa");
}

/** Ids de las categorías que son de complementos. */
export function idsDeCategoriasComplementos(
  categorias: { id: string; slug?: string | null; name?: string | null }[]
): Set<string> {
  return new Set(
    categorias
      .filter((c) => esCategoriaComplementos(c.slug, c.name))
      .map((c) => c.id)
  );
}

/**
 * La taza personalizada necesita su configurador (subir foto y ajustar).
 *
 * Se reconoce por el NOMBRE, no por la casilla "Complementa tu regalo": esa casilla
 * sirve para ofrecer complementos, y al desactivarla en la taza se quedaba sin
 * personalizador (que es justo lo que la distingue).
 *
 * Vive en este archivo (sin "use client") porque lo usan tanto el servidor (la ficha
 * del producto) como el navegador (el modal de complementos).
 */
export function esTazaPersonalizada(producto: { name?: string | null }): boolean {
  return /taza/i.test(String(producto?.name || ""));
}
