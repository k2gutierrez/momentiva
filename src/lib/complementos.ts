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
