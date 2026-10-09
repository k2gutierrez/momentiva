import sharp from "sharp";

/**
 * Optimiza una imagen ANTES de guardarla en el almacenamiento.
 *
 * ¿Por qué? Las fotos que se suben desde el celular pesan 2-4 MB y vienen con
 * dimensiones enormes (por ejemplo 3024×4032). Guardadas así, el catálogo engorda y la
 * tienda se vuelve lenta (y el consumo de Supabase se dispara).
 *
 * Reglas:
 * - Se reduce a un máximo de 1600 px de lado mayor (nunca se agranda).
 * - Se respeta la orientación de la foto (si viene girada del celular, se corrige).
 * - Si la imagen tiene transparencia se guarda en PNG (para no romperla); si no, en JPG.
 * - Calidad 85: se ve nítida y pesa una fracción de lo original.
 */
export async function optimizarImagenArchivo(archivo: File): Promise<{
  datos: Buffer;
  contentType: string;
  extension: string;
}> {
  const entrada = Buffer.from(await archivo.arrayBuffer());

  const imagen = sharp(entrada, { failOn: "none" }).rotate();
  const meta = await imagen.metadata();
  const tieneTransparencia = Boolean(meta.hasAlpha);

  const reducida = imagen.resize({
    width: 1600,
    height: 1600,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (tieneTransparencia) {
    const datos = await reducida.png({ compressionLevel: 9, quality: 85 }).toBuffer();
    return { datos, contentType: "image/png", extension: "png" };
  }

  const datos = await reducida.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  return { datos, contentType: "image/jpeg", extension: "jpg" };
}
