import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import HeroCarousel from "@/components/HeroCarousel";
import InstagramFeed from "@/components/InstagramFeed";

export const dynamic = 'force-dynamic';

export default async function CuidadosPage() {
  const supabase = await createClient();

  // 1. Fetch active carousel slides
  const { data: carouselSlides } = await supabase
    .from("homepage_carousel")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // 2. Fetch active Instagram posts para esta página
  const { data: instaPosts } = await supabase
    .from("instagram_feed")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // Arreglo de cuidados
  const cuidados = [
    {first: "Mantenlo alejado de fuentes de calor directo ", second: "(sol directo, calefacción, chimeneas) — el calor hace que el globo se expanda y se debilite."},
    {first: "Evita superficies con bordes o texturas ásperas ", second: "cerca del globo (uñas, joyería, mascotas, plantas con espinas)."},
    {first: "Consérvalo en interiores ", second: "idealmente a temperatura ambiente estable."},
    {first: "No lo expongas a cambios bruscos de temperatura ", second: "(de un cuarto frío a uno caliente, por ejemplo)."},
    {first: "Limpia la superficie del globo con un paño suave y seco ", second: "si acumula polvo; evita productos de limpieza o alcohol."},
    {first: "No lo aprietes ni lo cargues con fuerza ", second: "—- aunque es resistente, el plástico puede debilitarse con presión constante."},
    {first: "Aléjalo de vientos directos o corrientes de aire fuertes ", second: "(ventiladores, aire acondicionado directo)."},
    {first: "Colócalo en un lugar estable", second: ", donde no corra riesgo de caerse o golpearse."}
  ];

  return (
    <main className="bg-white min-h-screen flex flex-col">
      <AuthModal />
      <Header />

      {/* Dynamic Hero Carousel */}
      <HeroCarousel slides={carouselSlides || []} />

      {/* Contenido de "Cuidados" con fondo moradito */}
      <section className="bg-[#F5EFF6] flex-grow w-full py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6 text-left">
          
          <div className="mb-10">
            <span className="text-2xl font-handwriting text-terracota block mb-1">
              Así duraran por más tiempo…
            </span>
            <h2 className="text-3xl md:text-4xl text-[#3A243F] font-bold">
              Cuidados para tu globo
            </h2>
          </div>

          <div className="space-y-4">
            {cuidados.map((cuidado, index) => (
              <p key={index} className="text-[#3A243F] text-base md:text-lg leading-relaxed">
                <span className="font-bold">{cuidado.first}</span>{cuidado.second}
              </p>
            ))}
          </div>

        </div>
      </section>

      {/* Instagram Feed Section */}
      <InstagramFeed posts={instaPosts || []} />

      {/* Footer */}
      <Footer />
    </main>
  );
}