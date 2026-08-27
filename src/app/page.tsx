import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import CupPreviewer from "@/components/CupPreviewer";
import HeroCarousel from "@/components/HeroCarousel";
import Link from "next/link";
import { TruckIcon, SparkleIcon, ArrowRightIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  
  // 1. Fetch active products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // 2. Fetch active carousel slides from your homepage_carousel table
  const { data: carouselSlides } = await supabase
    .from("homepage_carousel")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  return (
    <main className="min-h-screen bg-cream font-sans">
      <AuthModal />
      
      {/* Top Announcement Bar */}
      <div className="bg-berenjena text-white py-2 px-4 text-center text-xs md:text-sm font-semibold tracking-wide border-b border-lilaPastel/20">
        ✨ Entregas locales en Guadalajara, Zapopan y Tlajomulco | ¡Personaliza tu regalo hoy!
      </div>

      {/* Header */}
      <Header />

      {/* Dynamic Hero Carousel */}
      <HeroCarousel slides={carouselSlides || []} />

      {/* Trust Badges */}
      <section className="bg-white border-y border-lilaPastel py-8">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="p-3 bg-sage/10 text-sage rounded-2xl">
              <TruckIcon size={32} weight="light" />
            </div>
            <div>
              <h4 className="font-bold text-berenjena">Envío Local Seguro</h4>
              <p className="text-xs text-gray-500">Guadalajara, Zapopan y Tlajomulco</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="p-3 bg-terracota/10 text-terracota rounded-2xl">
              <SparkleIcon size={32} weight="light" />
            </div>
            <div>
              <h4 className="font-bold text-berenjena">Detalles Personalizados</h4>
              <p className="text-xs text-gray-500">Diseños únicos adaptados a ti</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="p-3 bg-berenjena/10 text-berenjena rounded-2xl">
              <ShieldCheckIcon size={32} weight="light" />
            </div>
            <div>
              <h4 className="font-bold text-berenjena">Pago 100% Seguro</h4>
              <p className="text-xs text-gray-500">Tarjetas, PayPal y MercadoPago</p>
            </div>
          </div>

        </div>
      </section>

      {/* Catalog Grid */}
      <section id="catalog" className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold text-berenjena">Nuestra Colección</h3>
          <p className="text-gray-500 mt-2">Selecciona el detalle perfecto para regalar hoy mismo.</p>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link 
                href={`/product/${product.slug}`} 
                key={product.id} 
                className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-lilaPastel transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-64 bg-cream overflow-hidden">
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
                  {product.is_in_stock_item && (
                    <div className="absolute top-3 right-3 bg-sage text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Envío Hoy
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h4 className="text-lg font-bold text-berenjena mb-2 leading-tight group-hover:text-terracota transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-terracota font-bold text-2xl mb-4">
                    ${product.price.toFixed(2)} <span className="text-xs text-gray-400 font-normal">MXN</span>
                  </p>

                  <div className="mt-auto pt-4 border-t border-cream flex items-center justify-between text-sage group-hover:text-terracota transition-colors font-bold text-sm">
                    <span>Ver Producto</span>
                    <ArrowRightIcon size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                  </div>
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

      {/* 2D Cup Previewer */}
      <section id="cup-customizer" className="bg-white border-t border-lilaPastel py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-terracota uppercase tracking-widest bg-terracota/10 px-4 py-1.5 rounded-full">
              Experiencia Interactiva
            </span>
            <h3 className="text-4xl font-bold text-berenjena mt-3">Diseña tu Taza Personalizada</h3>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              Sube tu imagen favorita y observa en tiempo real cómo se adapta a la curvatura 3D de la taza antes de realizar tu pedido.
            </p>
          </div>
          
          <CupPreviewer />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-berenjena text-cream border-t border-lilaPastel/20 py-12 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-2xl font-bold text-cream mb-1">Momentiva</h4>
            <p className="text-sage font-handwriting text-xl mb-4">cada regalo, un momento inolvidable</p>
            <p className="text-xs text-lilaPastel/70 leading-relaxed">
              Momentos que se quedan por más tiempo. Regalos personalizados y globos burbuja con aire —no helio— que acompañan tus celebraciones por semanas. Entregamos en Guadalajara, Zapopan y Tlajomulco de Zúñiga.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-cream mb-3">Navegación</h5>
            <ul className="space-y-2 text-sm text-lilaPastel/80">
              <li><a href="#catalog" className="hover:text-cream transition-colors">Catálogo de Productos</a></li>
              <li><a href="#cup-customizer" className="hover:text-cream transition-colors">Diseñador 2D de Tazas</a></li>
              <li><Link href="/admin" className="hover:text-cream transition-colors">Acceso Administrador</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-cream mb-3">Cobertura</h5>
            <p className="text-sm text-lilaPastel/80 leading-relaxed">
              Entregas a domicilio en Guadalajara, Zapopan y Tlajomulco de Zúñiga.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-lilaPastel/10 text-center text-xs text-lilaPastel/50">
          © {new Date().getFullYear()} Momentiva. Todos los derechos reservados.
        </div>
      </footer>

    </main>
  );
}