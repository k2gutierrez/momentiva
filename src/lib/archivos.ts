import "server-only";

/**
 * Valida el contenido REAL de una imagen (no el nombre del archivo).
 *
 * Confiar en la extensión del nombre permite subir un `.jpg` que en realidad es
 * un SVG o un HTML. Como el bucket de productos es público, eso serviría contenido
 * activo desde el dominio de Supabase (phishing / abuso). Aquí se leen los
 * primeros bytes ("magic numbers") y se devuelve la extensión segura.
 */
export type TipoImagen = "image/jpeg" | "image/png" | "image/webp" | "image/svg+xml";

export async function tipoImagenReal(archivo: File): Promise<TipoImagen | null> {
  const cabecera = new Uint8Array(await archivo.slice(0, 12).arrayBuffer());

  // SVG: empieza por "<svg" o por la declaración XML. Solo se acepta para las
  // subidas del panel (diseño de banners); NUNCA para fotos de clientes.
  const texto = new TextDecoder().decode(cabecera).trim().toLowerCase();
  if (texto.startsWith("<svg") || texto.startsWith("<?xml")) {
    return "image/svg+xml";
  }

  const esJpeg = cabecera[0] === 0xff && cabecera[1] === 0xd8 && cabecera[2] === 0xff;
  if (esJpeg) return "image/jpeg";

  const esPng =
    cabecera[0] === 0x89 &&
    cabecera[1] === 0x50 &&
    cabecera[2] === 0x4e &&
    cabecera[3] === 0x47;
  if (esPng) return "image/png";

  const esWebp =
    cabecera[0] === 0x52 && // R
    cabecera[1] === 0x49 && // I
    cabecera[2] === 0x46 && // F
    cabecera[3] === 0x46 && // F
    cabecera[8] === 0x57 && // W
    cabecera[9] === 0x45 && // E
    cabecera[10] === 0x42 && // B
    cabecera[11] === 0x50; // P
  if (esWebp) return "image/webp";

  return null;
}

const EXTENSION: Record<TipoImagen, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/**
 * Devuelve la extensión segura o lanza un error claro si el archivo no es una
 * imagen válida.
 *
 * `permitirSvg` solo debe activarse en las subidas del panel de administración
 * (el diseño de los banners es SVG). El SVG puede contener scripts, así que se
 * sirve desde el dominio de Supabase —otro origen— y nunca desde el nuestro.
 */
export async function extensionImagenSegura(
  archivo: File,
  opciones: { permitirSvg?: boolean } = {}
): Promise<string> {
  const tipo = await tipoImagenReal(archivo);
  if (!tipo || (tipo === "image/svg+xml" && !opciones.permitirSvg)) {
    throw new Error(
      `"${archivo.name}" no es una imagen válida (solo JPG, PNG o WebP).`
    );
  }
  return EXTENSION[tipo];
}
