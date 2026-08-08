import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import CupPreviewer from "@/components/CupPreviewer";
import Link from "next/link";

// Force Next.js to fetch fresh data on every request for this page
export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch active products from the database
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-cream font-sans pb-20">
      <AuthModal />
      <Header />

      {/* Dynamic Carousel Placeholder (Requirement: 3 images)[cite: 1] */}
      <section className="relative w-full h-[450px] bg-berenjena flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Placeholder for the background image */}
        <div className="absolute inset-0 bg-sage opacity-20 mix-blend-multiply"></div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-5xl font-bold mb-4 text-cream tracking-tight">Regalos que cuentan historias</h2>
          <p className="text-2xl font-handwriting text-lilaPastel mb-8">
            Encuentra el detalle perfecto para esa persona especial.
          </p>
          <button className="bg-terracota hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105">
            Ver Colección
          </button>
        </div>
      </section>

      {/* Categories Bar[cite: 1] */}
      <section className="max-w-7xl mx-auto px-8 py-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-md border border-lilaPastel p-4 flex justify-center gap-8 overflow-x-auto">
          {['Todos', 'Regalos Personalizados', 'Postres', 'Arreglos', 'En Stock'].map((cat) => (
            <button key={cat} className="whitespace-nowrap font-bold text-berenjena hover:text-terracota transition-colors px-4 py-2">
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Catalog Grid */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-berenjena">Nuestro Catálogo</h3>
          <p className="text-gray-500 mt-2">Productos diseñados con amor y dedicación.</p>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link href={`/product/${product.slug}`} key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-lilaPastel transition-all duration-300">
                {/* Product Image */}
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
                  {/* Stock Badge[cite: 1] */}
                  {product.is_in_stock_item && (
                    <div className="absolute top-3 right-3 bg-sage text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Envío Hoy
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-5 flex flex-col flex-1">
                  <h4 className="text-lg font-bold text-berenjena mb-1 leading-tight group-hover:text-terracota transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-terracota font-bold text-xl mb-4">
                    ${product.price.toFixed(2)}
                  </p>
                  
                  {/* Call to action */}
                  <div className="mt-auto pt-4 border-t border-cream">
                    <span className="block text-center text-sm font-bold text-sage group-hover:text-terracota transition-colors">
                      Ver Detalles
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Aún no hay productos disponibles en la tienda.</p>
          </div>
        )}
      </section>

      {/* Interactive Custom Cup Section[cite: 1] */}
      <section className="bg-white border-t border-lilaPastel py-16">
        <div className="max-w-7xl mx-auto px-8">
          <CupPreviewer />
        </div>
      </section>

    </main>
  );
}