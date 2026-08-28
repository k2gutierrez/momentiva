import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import CupPreviewer from "@/components/CupPreviewer";
import ProductOptionsForm from "@/components/ProductOptionsForm"; 
import { notFound } from "next/navigation";
import { ShieldCheckIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

// 1. En Next.js 15, params es una Promesa, así que lo tipamos como tal
export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const supabase = await createClient();

  // 2. Usamos await para "desenvolver" el slug antes de usarlo
  const { slug } = await params;

  // 3. Consultamos a Supabase con el slug ya extraído
  const { data: product, error } = await supabase
    .from("products")
    .select("*, category:categories(name, slug)")
    .eq("slug", slug)
    .eq("is_active", true) // Lo regresamos porque me confirmas que sí es true
    .single();

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 text-center">
        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
          <h1 className="text-red-500 font-bold text-xl mb-2">Error cargando el producto</h1>
          <p className="text-gray-600">{error?.message || "El producto no existe."}</p>
        </div>
      </div>
    );
  }

  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <main className="bg-white min-h-screen flex flex-col">
      <AuthModal />
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-20 w-full flex-grow">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* Columna Izquierda: Galería de Imágenes */}
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-[4/5] bg-[#F5EFF6] rounded-3xl overflow-hidden border border-lilaPastel shadow-sm">
              {mainImage ? (
                <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sage font-bold">Sin imagen</div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            
            {product.category && (
              <span className="text-sage font-bold uppercase tracking-widest text-xs mb-3 block">
                {product.category.name}
              </span>
            )}
            
            <h1 className="text-3xl md:text-5xl font-bold text-[#3A243F] mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="text-3xl md:text-4xl font-bold text-terracota mb-6">
              ${product.price.toFixed(2)} <span className="text-base text-gray-500 font-normal">MXN</span>
            </div>

            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8">
              {product.description || "Un detalle inolvidable preparado a mano en Guadalajara."}
            </p>

            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-[#3A243F] font-bold">
                <SparkleIcon size={20} className="text-terracota" weight="fill" />
                Globos burbuja con aire (duran semanas, no días).
              </div>
              <div className="flex items-center gap-3 text-sm text-[#3A243F] font-bold">
                <ShieldCheckIcon size={20} className="text-sage" weight="fill" />
                Pago seguro y envío local en ZMG.
              </div>
            </div>

            {/* FORMULARIO DINÁMICO Y BOTÓN DE CARRITO */}
            <ProductOptionsForm 
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                slug: product.slug,
                image: mainImage || "/placeholder.jpg",
                custom_options: product.custom_options
              }} 
            />

          </div>
        </div>
      </section>

      {/* Sección: Complementa tu Regalo */}
      <section className="bg-cream border-t border-lilaPastel py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-[#3A243F]">Complementa tu regalo</h3>
          </div>
          <CupPreviewer />
        </div>
      </section>

      <Footer />
    </main>
  );
}