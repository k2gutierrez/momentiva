import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import Link from "next/link";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const supabase = await createClient();
  const categoriaSlug = searchParams?.categoria;

  // 1. Obtener todas las categorías para pintar los botones de filtro
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  // 2. Construir la consulta de productos
  let productsQuery = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Si hay una categoría en la URL, filtramos los productos
  let activeCategoryName = "Todos los productos";
  if (categoriaSlug && categories) {
    const selectedCat = categories.find((c) => c.slug === categoriaSlug);
    if (selectedCat) {
      productsQuery = productsQuery.eq("category_id", selectedCat.id);
      activeCategoryName = selectedCat.name;
    }
  }

  const { data: products } = await productsQuery;

  return (
    <main className="bg-[#F5EFF6] min-h-screen flex flex-col">
      <AuthModal />
      <Header />

      <section className="flex-grow w-full py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          {/* Título de la Tienda */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-[#3A243F] mb-4">
              Nuestra Tienda
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explora nuestra selección de globos burbuja, regalos personalizados y complementos diseñados para hacer de cada celebración un momento inolvidable.
            </p>
          </div>

          {/* Barra de Filtros de Categorías (Scrollable en móviles) */}
          <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-12 pb-4 snap-x">
            <Link
              href="/tienda"
              className={`whitespace-nowrap snap-center px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
                !categoriaSlug
                  ? "bg-[#3A243F] text-white"
                  : "bg-white text-[#3A243F] border border-lilaPastel hover:border-terracota"
              }`}
            >
              Todos
            </Link>
            
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/tienda?categoria=${cat.slug}`}
                className={`whitespace-nowrap snap-center px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
                  categoriaSlug === cat.slug
                    ? "bg-[#3A243F] text-white"
                    : "bg-white text-[#3A243F] border border-lilaPastel hover:border-terracota"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Indicador de Categoría Activa */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#3A243F]">
              {activeCategoryName} <span className="text-gray-400 font-normal text-sm ml-2">({products?.length || 0} productos)</span>
            </h2>
          </div>

          {/* Grid de Productos */}
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {products.map((product) => (
                <Link
                  href={`/product/${product.slug}`}
                  key={product.id}
                  className="group flex flex-col bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-lilaPastel/50 rounded-2xl shadow-sm hover:shadow-xl pb-2"
                >
                  {/* Imagen del Producto */}
                  <div className="relative h-64 md:h-72 bg-cream overflow-hidden rounded-t-2xl">
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
                    
                    {/* Badge de Stock/Envío (Opcional) */}
                    {product.is_in_stock_item && (
                      <div className="absolute top-3 right-3 bg-sage text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm">
                        Envío Hoy
                      </div>
                    )}
                  </div>

                  {/* Info del Producto */}
                  <div className="p-5 flex flex-col flex-1 text-center">
                    <h4 className="text-base font-bold text-[#3A243F] mb-2 leading-tight group-hover:text-terracota transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-terracota font-bold text-xl mb-4 mt-auto">
                      ${product.price.toFixed(2)} <span className="text-xs text-gray-400 font-normal">MXN</span>
                    </p>
                    
                    {/* Fake Button for visual weight */}
                    <div className="w-full bg-[#F5EFF6] text-[#3A243F] text-sm font-bold py-2.5 rounded-lg group-hover:bg-terracota group-hover:text-white transition-colors flex items-center justify-center gap-2">
                      Ver detalle <ArrowRightIcon size={16} weight="bold" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Estado Vacío (Sin productos en la categoría) */
            <div className="text-center py-24 bg-white rounded-3xl border border-lilaPastel shadow-sm">
              <MagnifyingGlassIcon size={48} className="mx-auto mb-4 text-lilaPastel" weight="light" />
              <h3 className="text-xl font-bold text-[#3A243F] mb-2">No encontramos productos</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                Actualmente no hay productos disponibles en esta categoría. Intenta explorar otras opciones.
              </p>
              <Link
                href="/tienda"
                className="bg-terracota hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm inline-block"
              >
                Ver todos los productos
              </Link>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </main>
  );
}