import { createClient } from "@/lib/supabase/server";
import { fetchInstagramFeed } from "@/lib/instagram";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import HeroCarousel from "@/components/HeroCarousel";
import InstagramFeed from "@/components/InstagramFeed";
import Link from "next/link";
import Footer from "@/components/Footer";
import { idsDeCategoriasComplementos } from "@/lib/complementos";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  // 1. Fetch active products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, images, category_id")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // 2. Fetch active carousel slides
  const { data: carouselSlides } = await supabase
    .from("homepage_carousel")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // 3. Feed de Instagram: preferimos la sincronización automática (Graph API);
  //    si no hay token o falla, usamos el feed manual del admin.
  const { data: instaPosts } = await supabase
    .from("instagram_feed")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const graphPosts = await fetchInstagramFeed(12);
  const instaFeed = graphPosts.length > 0 ? graphPosts : (instaPosts || []);

  // 4. Categorías para el menú "¿Qué quieres celebrar?"
  //    Solo mostramos las que ya tienen al menos un producto activo: las vacías
  //    quedan ocultas y aparecen solas en cuanto se les agregue un producto.
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  // Los productos de "Complementa tu regalo" no son catálogo: solo se ofrecen
  // dentro de los productos que aceptan complementos.
  const idsComplementos = idsDeCategoriasComplementos(categories || []);
  const productosCatalogo = (products || []).filter(
    (p) => !p.category_id || !idsComplementos.has(p.category_id)
  );

  const categoriasConProductos = (categories || []).filter(
    (cat) =>
      !idsComplementos.has(cat.id) &&
      productosCatalogo.some((p) => p.category_id === cat.id)
  );

  return (
    <main className="bg-white min-h-screen">
      <AuthModal />
      <Header />

      {/* Dynamic Hero Carousel */}
      <HeroCarousel slides={carouselSlides || []} />

      {/* Lema de marca */}
      <section className="bg-white py-10 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl md:text-2xl font-bold text-berenjena leading-relaxed">
            Momentos que se quedan por más tiempo.
          </p>
          <p className="text-gray-600 text-base md:text-lg mt-2 leading-relaxed">
            Regalos personalizados y globos burbuja con aire —no helio— que acompañan tus celebraciones por semanas. Entregamos en Guadalajara, Zapopan y Tlajomulco de Zúñiga.
          </p>
        </div>
      </section>

      {/* Quick Filters (Cuadros Grandes) */}
      {/*<section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Link href="/tienda?categoria=aniversarios" className="bg-[#EBE0EC] aspect-square flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all duration-300 group">
              <img src="/assets/íconos-09-transparent.png" alt="Aniversarios" className="w-full h-full object-contain" />
              <span className="text-sm font-bold text-berenjena mt-3 group-hover:text-terracota transition-colors">Aniversarios</span>
            </Link>
            <Link href="/tienda?categoria=beb" className="bg-[#EBE0EC] aspect-square flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all duration-300 group">
              <img src="/assets/íconos-06-transparent.png" alt="Bebé" className="w-full h-full object-contain" />
              <span className="text-sm font-bold text-berenjena mt-3 group-hover:text-terracota transition-colors">Bebé</span>
            </Link>
            <Link href="/tienda?categoria=cumplea-os" className="bg-[#EBE0EC] aspect-square flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all duration-300 group">
              <img src="/assets/íconos-07-transparent.png" alt="Cumpleaños" className="w-full h-full object-contain" />
              <span className="text-sm font-bold text-berenjena mt-3 group-hover:text-terracota transition-colors">Cumpleaños</span>
            </Link>
            <Link href="/tienda?categoria=especiales" className="bg-[#EBE0EC] aspect-square flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all duration-300 group">
              <img src="/assets/íconos-10-transparent.png" alt="Especiales" className="w-full h-full object-contain" />
              <span className="text-sm font-bold text-berenjena mt-3 group-hover:text-terracota transition-colors">Especiales</span>
            </Link>
          </div>
        </div>
      </section>*/}

      {/* Menú de categorías (igual que en Tienda) */}
      <section className="bg-white pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <h3 className="text-2xl md:text-3xl font-bold text-berenjena text-center mb-6">
            ¿Qué quieres celebrar?
          </h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 snap-x justify-start md:justify-center">
            <Link
              href="/tienda"
              className="whitespace-nowrap snap-center px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm bg-[#3A243F] text-white"
            >
              Todos
            </Link>
            {categoriasConProductos.map((cat) => (
              <Link
                key={cat.id}
                href={`/tienda?categoria=${cat.slug}`}
                className="whitespace-nowrap snap-center px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm bg-[#EBE0EC] text-[#3A243F] hover:bg-lilaPastel transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section id="catalog" className="bg-cream/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-berenjena">¡Globos personalizados para cualquier ocasión!</h2>
        </div>

        {productosCatalogo.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {productosCatalogo.map((product) => (
              <Link
                href={`/product/${product.slug}`}
                key={product.id}
                className="group flex flex-col bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 rounded-2xl shadow-md hover:shadow-xl pb-2"
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
          <div className="text-center py-20 bg-white rounded-3xl p-12">
            <p className="text-gray-500 text-lg">Aún no hay productos visibles en el catálogo.</p>
          </div>
        )}
        </div>
      </section>

      {/* Instagram Feed Section: sincronizado con Instagram */}
      <InstagramFeed posts={instaFeed} />

      {/* Footer */}
      <Footer />
    </main>
  );
}