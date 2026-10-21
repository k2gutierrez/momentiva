"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { META_PIXEL_ID } from "@/lib/metaPixel";
import { EVENTO_CONSENTIMIENTO, permiteMedicion } from "@/lib/cookies";

/**
 * Píxel de Meta.
 *
 * - Solo se activa si la clienta ACEPTÓ las cookies de medición (aviso de cookies).
 *   Si eligió "solo las necesarias", no se carga nada de Meta.
 * - Instala el código base una sola vez y registra una vista de página (PageView) al
 *   entrar y cada vez que se navega dentro de la tienda sin recargar.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const [permitido, setPermitido] = useState(false);
  const ultimaRegistrada = useRef<string | null>(null);

  // Se revisa el permiso al cargar y cada vez que la clienta cambia su decisión.
  useEffect(() => {
    const revisar = () => setPermitido(permiteMedicion());
    revisar();
    window.addEventListener(EVENTO_CONSENTIMIENTO, revisar);
    return () => window.removeEventListener(EVENTO_CONSENTIMIENTO, revisar);
  }, []);

  // Vista de página al navegar dentro de la tienda (sin duplicar la misma pantalla).
  useEffect(() => {
    if (!META_PIXEL_ID || !permitido) return;
    if (ultimaRegistrada.current === null) {
      ultimaRegistrada.current = pathname;
      return;
    }
    if (ultimaRegistrada.current === pathname) return;
    ultimaRegistrada.current = pathname;
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, permitido]);

  if (!META_PIXEL_ID || !permitido) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
