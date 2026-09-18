import "server-only";

/**
 * Límite de intentos en memoria (sencillo, sin infraestructura extra).
 *
 * Sirve para el despliegue actual (una sola instancia en Hostinger). Si algún día
 * hay varias instancias, habrá que moverlo a un almacén compartido (Upstash/Redis).
 *
 * Uso:
 *   const limite = limitarIntentos(`checkout:${ip}`, 10, 60_000);
 *   if (!limite.permitido) return { success: false, error: limite.mensaje };
 */
type Registro = { cuenta: number; reinicia: number };

const registros = new Map<string, Registro>();

// Limpieza perezosa para que el Map no crezca sin control
function limpiar(ahora: number) {
  if (registros.size < 5000) return;
  for (const [clave, r] of registros) {
    if (r.reinicia <= ahora) registros.delete(clave);
  }
}

export interface ResultadoLimite {
  permitido: boolean;
  restantes: number;
  mensaje?: string;
}

export function limitarIntentos(
  clave: string,
  maximo = 10,
  ventanaMs = 60_000
): ResultadoLimite {
  const ahora = Date.now();
  limpiar(ahora);

  const actual = registros.get(clave);

  if (!actual || actual.reinicia <= ahora) {
    registros.set(clave, { cuenta: 1, reinicia: ahora + ventanaMs });
    return { permitido: true, restantes: maximo - 1 };
  }

  actual.cuenta += 1;

  if (actual.cuenta > maximo) {
    const segundos = Math.ceil((actual.reinicia - ahora) / 1000);
    return {
      permitido: false,
      restantes: 0,
      mensaje: `Demasiados intentos. Espera ${segundos} segundo(s) e inténtalo de nuevo.`,
    };
  }

  return { permitido: true, restantes: maximo - actual.cuenta };
}

/** IP del visitante según las cabeceras del proxy (Hostinger usa x-forwarded-for). */
export function ipDelVisitante(cabeceras: Headers): string {
  const reenviada = cabeceras.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0].trim();
  return cabeceras.get("x-real-ip") || "desconocida";
}
