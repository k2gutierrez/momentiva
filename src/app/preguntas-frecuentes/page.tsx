import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import HeroCarousel from "@/components/HeroCarousel";

export const dynamic = 'force-dynamic';

export default async function PreguntasFrecuentesPage() {
  const supabase = await createClient();

  // 1. Fetch active carousel slides para mantener el banner principal
  const { data: carouselSlides } = await supabase
    .from("homepage_carousel")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // Arreglo de Preguntas Frecuentes
  const faqs = [
    {
      pregunta: "¿Cuánto dura el globo?",
      respuesta: "Con aire, nuestros globos pueden durar semanas — incluso hemos probado arreglos que se mantienen bien hasta 3 meses en condiciones óptimas."
    },
    {
      pregunta: "¿Qué puede llevar el globo adentro?",
      respuesta: "Muchísimas cosas: funkos, flores, peluches, maquillaje, globos pequeños, diamantina, unicel de colores, juegos de mesa pequeños, ropa de bebé y más. Cuéntanos la ocasión y te ayudamos a elegir."
    },
    {
      pregunta: "¿Se puede personalizar?",
      respuesta: "Sí, puedes elegir el mensaje o dedicatoria, y los colores de la decoración (listones y papel)."
    },
    {
      pregunta: "¿A qué zonas entregan?",
      respuesta: "Hacemos entregas a domicilio en Zapopan, Tlajomulco, Guadalajara y Tlaquepaque."
    },
    {
      pregunta: "¿Con cuánta anticipación debo pedir?",
      respuesta: "Con 3 días de anticipación. Tenemos dos horarios de entrega: de 9am a 1pm, o de 1pm a 6pm."
    },
    {
      pregunta: "¿Puedo enviarlo como regalo sorpresa a otra persona?",
      respuesta: "¡Claro! Podemos entregarlo directamente a la persona que quieras sorprender."
    },
    {
      pregunta: "¿Qué métodos de pago aceptan?",
      respuesta: "Tarjeta de crédito y débito."
    },
    {
      pregunta: "¿Puedo cambiar o cancelar mi pedido?",
      respuesta: "Cada globo se personaliza especialmente para ti, así que no podemos hacer cambios ni cancelaciones después de confirmar el pedido. ¿Tienes dudas antes de comprar? Escríbenos, con gusto te orientamos."
    }
  ];

  return (
    <main className="bg-white min-h-screen flex flex-col">
      <AuthModal />
      <Header />

      {/* Dynamic Hero Carousel */}
      <HeroCarousel slides={carouselSlides || []} />

      {/* Contenido de "Preguntas Frecuentes" */}
      <section className="flex-grow max-w-5xl mx-auto px-6 py-16 md:py-20 bg-white text-left w-full">
        
        <div className="space-y-10">
          {faqs.map((faq, index) => (
            <div key={index} className="space-y-2">
              <h3 className="text-xl md:text-2xl text-terracota">
                {faq.pregunta}
              </h3>
              <p className="text-gray-800 text-base md:text-lg leading-relaxed">
                {faq.respuesta}
              </p>
            </div>
          ))}
        </div>

      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}