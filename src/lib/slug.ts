// Generador de slugs único para todo el proyecto.
//
// Antes había tres implementaciones distintas y dos de ellas NO quitaban los
// acentos, por eso quedaron slugs como "beb" (Bebé), "cumplea-os" (Cumpleaños)
// o "graduacin" (Graduación). Esta versión normaliza a NFD y elimina los
// diacríticos, así que "Cumpleaños" -> "cumpleanos".
export function slugify(texto: string): string {
  const limpio = String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos: á -> a, ñ -> n, ü -> u
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // símbolos (™, ®, “ ”, +) y espacios -> guion
    .replace(/^-+|-+$/g, ""); // recorta guiones de los extremos

  return limpio || "producto";
}

// Slug para productos: base legible + marca de tiempo para garantizar unicidad.
// Se conserva la marca de tiempo anterior cuando existe, para que la URL no
// cambie de número cada vez que se edita el nombre.
export function slugDeProducto(nombre: string, marcaTiempo?: number | string | null): string {
  const sello = marcaTiempo ? String(marcaTiempo) : String(Date.now());
  return `${slugify(nombre)}-${sello}`;
}

// Extrae la marca de tiempo final de un slug existente ("...-1789596767567").
export function marcaTiempoDeSlug(slug?: string | null): string | null {
  const match = String(slug ?? "").match(/-(\d{10,})$/);
  return match ? match[1] : null;
}
