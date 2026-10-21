import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Aviso de privacidad | Momentiva",
  description:
    "Cómo Momentiva recopila, usa y protege tus datos personales, y cómo puedes ejercer tus derechos.",
};

const ULTIMA_ACTUALIZACION = "octubre de 2026";
const WHATSAPP = "3349427375";

export default function AvisoDePrivacidadPage() {
  return (
    <main className="bg-cream min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-berenjena mb-2">
          Aviso de privacidad
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Última actualización: {ULTIMA_ACTUALIZACION}
        </p>

        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-10 space-y-7 text-[15px] leading-relaxed text-[#3A243F]">
          <section>
            <h2 className="text-lg font-bold text-berenjena mb-2">1. Quién es el responsable</h2>
            <p>
              <strong>Momentiva</strong> (Guadalajara, Jalisco, México) es responsable del
              tratamiento de los datos personales que recibe a través de{" "}
              <strong>momentiva.com.mx</strong> y de nuestros canales de atención.
            </p>
            <p className="mt-2">
              Para cualquier asunto relacionado con tus datos, escríbenos por WhatsApp al{" "}
              <strong>{WHATSAPP}</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-berenjena mb-2">2. Qué datos recabamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Datos de contacto: nombre, teléfono y correo electrónico.</li>
              <li>
                Datos de entrega: dirección, colonia, código postal, referencias y datos de
                quien recibe el regalo.
              </li>
              <li>Detalle de tus pedidos, mensajes personalizados y fotos que nos compartas.</li>
              <li>
                Datos de pago: <strong>no guardamos los datos de tu tarjeta</strong>; el cobro lo
                procesa directamente Mercado Pago.
              </li>
              <li>
                Datos de navegación: páginas que visitas, dispositivo y actividad en el sitio,
                cuando aceptas las cookies de medición.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-berenjena mb-2">
              3. Para qué usamos tus datos
            </h2>
            <p className="font-semibold">Finalidades necesarias (sin ellas no podemos venderte):</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Registrar, preparar y entregar tu pedido.</li>
              <li>Contactarte para coordinar la entrega (WhatsApp o llamada).</li>
              <li>Procesar tu pago y, en su caso, reembolsos.</li>
              <li>Atender dudas, aclaraciones y garantías.</li>
            </ul>
            <p className="font-semibold mt-3">Finalidades adicionales (puedes oponerte):</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Medir el desempeño de nuestra publicidad en Meta (Facebook e Instagram).</li>
              <li>Enviarte promociones y novedades.</li>
            </ul>
            <p className="mt-2 text-sm text-gray-600">
              Si no quieres que tus datos se usen para estas finalidades adicionales, escríbenos
              por WhatsApp al {WHATSAPP} y lo haremos valer sin afectar tu pedido.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-berenjena mb-2">
              4. Cookies y tecnologías similares
            </h2>
            <p>
              Al entrar a la tienda te mostramos un <strong>aviso de cookies</strong> para que
              elijas qué permites.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Necesarias:</strong> sesión, carrito de compras y el proceso de pago con
                Mercado Pago. Sin ellas la tienda no puede funcionar.
              </li>
              <li>
                <strong>De medición (Meta):</strong> el píxel de Meta registra visitas y compras
                para medir y mejorar nuestra publicidad.{" "}
                <strong>Solo se activa si das tu permiso.</strong>
              </li>
            </ul>
            <p className="mt-2 text-sm text-gray-600">
              Puedes cambiar tu decisión en cualquier momento borrando las cookies de tu
              navegador; al volver a entrar te preguntaremos de nuevo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-berenjena mb-2">
              5. Con quién compartimos tus datos
            </h2>
            <p>
              No vendemos tus datos. Los compartimos únicamente con los proveedores que nos
              permiten operar:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>Mercado Pago</strong>, para procesar el cobro de tu pedido.</li>
              <li><strong>Hostinger y Supabase</strong>, donde se alojan la tienda y la información.</li>
              <li><strong>Servicio de correo</strong>, para enviarte la confirmación de tu compra.</li>
              <li>
                <strong>Meta</strong>, únicamente datos de navegación y compra (sin tus datos de
                contacto), y solo si aceptaste las cookies de medición.
              </li>
              <li>Servicios de mensajería, para la entrega de tu regalo.</li>
            </ul>
            <p className="mt-2">
              También podremos compartir información cuando lo exija una autoridad competente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-berenjena mb-2">6. Tus derechos (ARCO)</h2>
            <p>
              Puedes solicitar <strong>Acceder</strong> a tus datos,{" "}
              <strong>Rectificarlos</strong> si están incorrectos, <strong>Cancelarlos</strong>{" "}
              cuando ya no sean necesarios o <strong>Oponerte</strong> a su uso.
            </p>
            <p className="mt-2">
              Escríbenos por WhatsApp al <strong>{WHATSAPP}</strong> indicando tu nombre, el
              derecho que quieres ejercer y el detalle de tu solicitud. Te responderemos en un
              plazo máximo de <strong>20 días hábiles</strong>.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Conservamos los datos de tus pedidos el tiempo necesario para cumplir con la ley
              (por ejemplo, obligaciones fiscales) y para atender aclaraciones.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-berenjena mb-2">7. Seguridad</h2>
            <p>
              Protegemos tu información con medidas administrativas y técnicas: acceso restringido,
              conexión cifrada (HTTPS) y pago procesado por Mercado Pago, de modo que{" "}
              <strong>nunca vemos ni guardamos los datos de tu tarjeta</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-berenjena mb-2">8. Cambios a este aviso</h2>
            <p>
              Si modificamos este aviso, publicaremos la nueva versión en esta misma página con la
              fecha de actualización.
            </p>
          </section>

          <div className="pt-2 border-t border-lilaPastel">
            <p className="text-sm text-gray-600">
              ¿Dudas? Escríbenos por WhatsApp al <strong>{WHATSAPP}</strong> o revisa nuestras{" "}
              <Link href="/preguntas-frecuentes" className="font-bold text-terracota hover:underline">
                preguntas frecuentes
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
