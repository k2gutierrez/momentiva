// Utilidades de imagen compartidas (navegador).

/**
 * Comprime una imagen en el navegador antes de mandarla al servidor.
 * Máximo 900 px de lado y JPEG calidad 0.72: una foto de celular de 3-5 MB
 * termina pesando ~100-200 KB, que es lo que viaja en el carrito.
 */
export function comprimirImagen(file: File, maxLado = 900, calidad = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("La imagen no es válida"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxLado || height > maxLado) {
          if (width > height) {
            height = Math.round((height * maxLado) / width);
            width = maxLado;
          } else {
            width = Math.round((width * maxLado) / height);
            height = maxLado;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("El navegador no soporta canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.src = String(event.target?.result || "");
    };
    reader.readAsDataURL(file);
  });
}
