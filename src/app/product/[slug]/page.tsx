"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import CupPreviewer from "@/components/CupPreviewer";
import { ShoppingCartIcon, CalendarBlankIcon, PackageIcon } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State to track user selections for dynamic options
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  // Fetch the product data
  useEffect(() => {
    const fetchProduct = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data) {
        setProduct(data);
        setCalculatedPrice(data.price);
        
        // Initialize default states for custom options
        const initialOptions: Record<string, any> = {};
        if (data.custom_options) {
          data.custom_options.forEach((opt: any) => {
            if (opt.type === "checkbox") initialOptions[opt.name] = false;
            if (opt.type === "select") initialOptions[opt.name] = ""; 
          });
        }
        setSelectedOptions(initialOptions);
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [slug]);

  // Recalculate price whenever options change
  useEffect(() => {
    if (!product) return;
    let newTotal = product.price;

    product.custom_options?.forEach((opt: any) => {
      if (opt.type === "checkbox" && selectedOptions[opt.name]) {
        newTotal += opt.priceImpact;
      }
    });

    setCalculatedPrice(newTotal);
  }, [selectedOptions, product]);

  const handleAddToCart = () => {
    // We will connect this to Jotai global cart state later
    console.log("Adding to cart:", { product, selectedOptions, calculatedPrice });
    toast.success(`${product.name} agregado al carrito`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-berenjena">Cargando producto...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-berenjena">Producto no encontrado.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-sans pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-8 py-12 animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-lg border border-lilaPastel overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Image or Cup Previewer */}
          <div className="md:w-1/2 bg-cream/30 border-r border-lilaPastel p-8 flex items-center justify-center">
            {product.is_custom_cup ? (
              <CupPreviewer /> // Render the interactive 2D canvas for cups[cite: 1]
            ) : (
              <img 
                src={product.images?.[0] || "/placeholder.jpg"} 
                alt={product.name}
                className="w-full max-w-md h-auto object-cover rounded-xl shadow-sm"
              />
            )}
          </div>

          {/* Right Column: Product Details & Options */}
          <div className="md:w-1/2 p-10 flex flex-col">
            
            {/* Badges */}
            <div className="flex gap-3 mb-4">
              {product.is_in_stock_item ? (
                <span className="flex items-center gap-1 bg-sage/20 text-sage px-3 py-1 rounded-full text-sm font-bold">
                  <PackageIcon size={16} /> Envío Mismo Día
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                  <CalendarBlankIcon size={16} /> Pedir con {product.anticipation_days} días de anticipación
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-berenjena mb-2">{product.name}</h1>
            <p className="text-terracota text-3xl font-bold mb-6">${calculatedPrice.toFixed(2)} MXN</p>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Dynamic Custom Options Renderer[cite: 1] */}
            {product.custom_options && product.custom_options.length > 0 && (
              <div className="mb-8 space-y-4 bg-cream/30 p-6 rounded-xl border border-lilaPastel">
                <h3 className="font-bold text-berenjena mb-4">Personaliza tu pedido:</h3>
                
                {product.custom_options.map((opt: any, index: number) => (
                  <div key={index} className="flex flex-col">
                    
                    {opt.type === "checkbox" && (
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-terracota cursor-pointer"
                          checked={selectedOptions[opt.name] || false}
                          onChange={(e) => setSelectedOptions({...selectedOptions, [opt.name]: e.target.checked})}
                        />
                        <span className="text-berenjena font-semibold group-hover:text-terracota transition-colors">
                          {opt.name} <span className="text-sage text-sm">(+${opt.priceImpact.toFixed(2)})</span>
                        </span>
                      </label>
                    )}

                    {opt.type === "select" && (
                      <div className="flex flex-col">
                        <label className="text-sm font-bold text-berenjena mb-1">{opt.name}</label>
                        <select 
                          className="px-4 py-2 border border-lilaPastel rounded-lg bg-white text-berenjena focus:outline-none focus:ring-2 focus:ring-terracota"
                          value={selectedOptions[opt.name] || ""}
                          onChange={(e) => setSelectedOptions({...selectedOptions, [opt.name]: e.target.value})}
                        >
                          <option value="">Selecciona una opción...</option>
                          <option value="opcion1">Opción Estándar</option>
                          {/* Note: A fully robust select would need the admin to define the sub-options inside the JSON too! */}
                        </select>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}

            {/* Add to Cart Area */}
            <div className="mt-auto pt-8 border-t border-lilaPastel flex gap-4">
              <button 
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 text-white px-8 py-4 rounded-xl shadow-md transition-all duration-300 font-bold text-lg hover:-translate-y-1"
              >
                <ShoppingCartIcon size={24} weight="bold" />
                Agregar al Carrito
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}