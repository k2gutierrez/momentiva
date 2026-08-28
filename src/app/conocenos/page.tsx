import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import HeroCarousel from "@/components/HeroCarousel";
import InstagramFeed from "@/components/InstagramFeed";

export const dynamic = 'force-dynamic';

export default async function ConocenosPage() {
  const supabase = await createClient();

  // 1. Fetch active carousel slides
  const { data: carouselSlides } = await supabase
    .from("homepage_carousel")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // 2. Fetch active Instagram posts
  const { data: instaPosts } = await supabase
    .from("instagram_feed")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  return (
    <main className="bg-white min-h-screen flex flex-col">
      <AuthModal />
      <Header />

      {/* Dynamic Hero Carousel */}
      <HeroCarousel slides={carouselSlides || []} />

      {/* Contenido de "Conócenos" (Alineado a la izquierda con colores corregidos) */}
      <section className="flex-grow max-w-5xl mx-auto px-6 py-16 md:py-20 space-y-12 bg-white text-left w-full">
        
        {/* Bloque 1 */}
        <div className="space-y-3">
          <h3 className="text-2xl md:text-3xl text-terracota"> {/* [#3A243F] */}
            Dos hermanas, un mismo cariño por crear
          </h3>
          <p className="text-gray-800 text-base md:text-lg leading-relaxed">
            Somos Momentiva, dos hermanas y mamás que crecimos rodeadas de creatividad — heredada de nuestra mamá y nuestra abuela. Venimos de la comunicación corporativa y de la contaduría. Juntamos esos mundos para construir, algo que combinara cariño, cuidado y también orden: un regalo hecho con las manos y con el corazón.
          </p>
        </div>

        {/* Bloque 2 */}
        <div className="space-y-3">
          <h3 className="text-2xl md:text-3xl text-terracota">
            ¿Por qué aire y no helio?
          </h3>
          <p className="text-gray-800 text-base md:text-lg leading-relaxed">
            Elegimos inflar nuestros globos con aire, no con helio. El helio es un recurso no renovable y, además, indispensable para usos médicos — así que preferimos dejarlo donde más se necesita. Pero también hay otra razón: los globos con aire duran semanas, no solo días. Si vas a regalar algo, que sea algo que se quede un rato más 💝.
          </p>
        </div>

        {/* Bloque 3 */}
        <div className="space-y-3">
          <h3 className="text-2xl md:text-3xl text-terracota">
            Hecho a mano, con cariño, desde Guadalajara
          </h3>
          <p className="text-gray-800 text-base md:text-lg leading-relaxed">
            Cada arreglo que sale de nuestras manos lo armamos uno por uno, pensando en el momento y en la persona que lo va a recibir, imaginándonos su sonrisa al verlo — con el mismo amor con el que sabemos que lo van a regalar.
          </p>
        </div>

      </section>

      {/* Instagram Feed Section */}
      <InstagramFeed posts={instaPosts || []} />

      {/* Footer */}
      <Footer />
    </main>
  );
}