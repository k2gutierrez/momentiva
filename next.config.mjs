/** @type {import('next').NextConfig} */

// Se usa .mjs (JavaScript) en lugar de .ts a propósito:
// el servidor de Hostinger tiene una glibc antigua, el compilador nativo de Next
// no carga y Next cae al compilador WASM, que no logra compilar next.config.ts
// (error "Failed to load next.config.ts"). Un config en JS evita ese paso.

// Cabeceras de seguridad. La CSP completa va en modo "Report-Only" a propósito:
// el sitio carga Mercado Pago, Supabase e Instagram, así que primero se vigilan
// las violaciones en la consola y después se aplica.
const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.mercadopago.com https://widgets.sociablekit.com",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https://www.mercadopago.com https://www.mercadolibre.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.mercadopago.com",
].join("; ");

// CSP mínima que ya se APLICA: solo directivas que no pueden romper el sitio.
const cspAplicada = ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir el origen del túnel Cloudflare para que el JS funcione al probar por HTTPS
  allowedDevOrigins: ["exposure-emacs-tonight-ultimate.trycloudflare.com"],
  // Le decimos a Next.js que acepte peticiones de hasta 10MB en Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mvsabrcqhpwenamlqcux.supabase.co",
        port: "",
      },
    ],
  },
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Content-Security-Policy", value: cspAplicada },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
