import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import HeroCarousel from "@/components/HeroCarousel";
import InstagramFeed from "@/components/InstagramFeed";
import Link from "next/link";
import { FacebookLogoIcon, InstagramLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Footer from "@/components/Footer";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  // 1. Fetch active products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // 2. Fetch active carousel slides
  const { data: carouselSlides } = await supabase
    .from("homepage_carousel")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // 3. Fetch active Instagram posts
  const { data: instaPosts } = await supabase
    .from("instagram_feed")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  return (
    <main className="bg-white min-h-screen">
      <AuthModal />
      <Header />

      {/* Dynamic Hero Carousel */}
      <HeroCarousel slides={carouselSlides || []} />

      {/* Quick Filters (Cuadros Grandes) */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Link href="/tienda?categoria=aniversario" className="bg-[#EBE0EC] aspect-square flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all duration-300 group">
              <img src="/assets/íconos-09.png" alt="Aniversarios" className="object-contain" />
            </Link>
            <Link href="/tienda?categoria=bebe" className="bg-[#EBE0EC] aspect-square flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all duration-300 group">
              <img src="/assets/íconos-06.png" alt="Bebé" className="object-contain" />
            </Link>
            <Link href="/tienda?categoria=cumpleanos" className="bg-[#EBE0EC] aspect-square flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all duration-300 group">
              <img src="/assets/íconos-07.png" alt="Cumpleaños" className="object-contain" />
            </Link>
            <Link href="/tienda?categoria=especiales" className="bg-[#EBE0EC] aspect-square flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all duration-300 group">
              <img src="/assets/íconos-10.png" alt="Especiales" className="object-contain" />
            </Link>
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section id="catalog" className="bg-white max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-berenjena">¡Globos personalizados para cualquier ocasión!</h2>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <Link
                href={`/product/${product.slug}`}
                key={product.id}
                className="group flex flex-col bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-lilaPastel/50 rounded-xl pb-2"
              >
                <div className="relative h-64 md:h-72 bg-cream overflow-hidden rounded-xl">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sage text-sm font-bold bg-lilaPastel/30">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="py-4 flex flex-col flex-1 text-center">
                  <h4 className="text-base font-bold text-berenjena mb-1 leading-tight group-hover:text-terracota transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-berenjena font-bold text-lg">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-lilaPastel p-12">
            <p className="text-gray-500 text-lg">Aún no hay productos visibles en el catálogo.</p>
          </div>
        )}
      </section>

      {/* Instagram Feed Section: PASAMOS LA DATA REAL */}
      <InstagramFeed posts={instaPosts || []} />

      {/* Footer */}
      <Footer />
    </main>
  );
}