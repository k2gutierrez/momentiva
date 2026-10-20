"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { META_PIXEL_ID } from "@/lib/metaPixel";

/**
 * Píxel de Meta.
 *
 * - Instala el código base en todas las páginas (una sola vez).
 * - Registra una vista de página (PageView) al entrar y cada vez que se navega dentro
 *   de la tienda sin recargar (el código base ya cuenta la primera).
 *
 * Si no hay identificador configurado, no se muestra nada.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const ultimaRegistrada = useRef<string | null>(null);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    // La primera pantalla ya la cuenta el código base con su PageView; de ahí en
    // adelante se registra cada cambio de página (navegación sin recargar).
    // Se compara con la última registrada para no contar dos veces la misma.
    if (ultimaRegistrada.current === null) {
      ultimaRegistrada.current = pathname;
      return;
    }
    if (ultimaRegistrada.current === pathname) return;
    ultimaRegistrada.current = pathname;
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  if (!META_PIXEL_ID) return null;

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
