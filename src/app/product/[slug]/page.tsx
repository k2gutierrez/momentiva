import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import CupPreviewer from "@/components/CupPreviewer"; // Asegúrate de que la ruta sea correcta
import { notFound } from "next/navigation";
import { ShieldCheckIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import AddToCartButton from "@/components/AddToCartButton";

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();

  // 1. Obtener el producto basado en el Slug
  const { data: product, error } = await supabase
    .from("products")
    .select("*, category:categories(name, slug)")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  // Si no existe o hay error, mandamos a página 404
  if (error || !product) {
    notFound();
  }

  // Usar la primera imagen como principal
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <main className="bg-white min-h-screen flex flex-col">
      <AuthModal />
      <Header />

      {/* Sección del Producto Principal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-20 w-full flex-grow">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

          {/* Columna Izquierda: Galería de Imágenes */}
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-[4/5] bg-[#F5EFF6] rounded-3xl overflow-hidden border border-lilaPastel shadow-sm">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sage font-bold">
                  Sin imagen
                </div>
              )}
              {product.is_in_stock_item && (
                <div className="absolute top-4 right-4 bg-sage text-white text-xs uppercase font-bold px-4 py-2 rounded-full shadow-md">
                  Envío Hoy
                </div>
              )}
            </div>
            {/* Si tienes más imágenes, podrías iterarlas aquí abajo como miniaturas */}
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">

            {/* Breadcrumbs / Categoría */}
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

            {/* Garantías o Trust Badges */}
            <div className="flex flex-col gap-3 mb-10 bg-[#F5EFF6] p-5 rounded-2xl border border-lilaPastel">
              <div className="flex items-center gap-3 text-sm text-[#3A243F] font-bold">
                <SparkleIcon size={20} className="text-terracota" weight="fill" />
                Globos burbuja con aire (duran semanas, no días).
              </div>
              <div className="flex items-center gap-3 text-sm text-[#3A243F] font-bold">
                <ShieldCheckIcon size={20} className="text-sage" weight="fill" />
                Pago seguro y envío local en ZMG.
              </div>
            </div>

            {/* BOTÓN INTELIGENTE DE CARRITO */}
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                slug: product.slug,
                image: mainImage || "/placeholder.jpg"
              }}
            />
            <p className="text-center text-xs text-gray-400">
              Personalizaciones de texto y color se confirman en el carrito.
            </p>
          </div>
        </div>
      </section>

      {/* Sección: Complementa tu Regalo (Taza 2D) */}
      <section className="bg-cream border-t border-lilaPastel py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <span className="text-2xl font-handwriting text-terracota block mb-2">
              Hazlo aún más especial...
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-[#3A243F]">
              Complementa tu regalo
            </h3>
          </div>

          {/* Insertamos nuestro componente responsivo */}
          <CupPreviewer />
        </div>
      </section>

      <Footer />
    </main>
  );
}