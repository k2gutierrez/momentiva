"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

// Función para calcular la fecha mínima (hoy + 3 días)
const getMinDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().split('T')[0];
};

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formSelections, setFormSelections] = useState<Record<string, string>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);
  
  // Estado para controlar el menú lateral en móviles
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Guardamos la fecha mínima restringida
  const minDate = getMinDate();

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'Activo');
      
      const loadedProducts = productsData || [];
      setProducts(loadedProducts);

      if (loadedProducts.length > 0) {
        handleProductChange(loadedProducts[0]);
      }
      setLoading(false);
    };

    loadInitialData();
  }, []);

  // Bloquear el scroll del cuerpo cuando el menú está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const handleProductChange = async (product: any) => {
    setSelectedProduct(product);
    setTotalPrice(product.base_price);
    setFormSelections({});

    const { data: fieldsData } = await supabase
      .from('product_fields')
      .select(`
        id, label, type, placeholder,
        field_options (id, label, preview_image, additional_price)
      `)
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true });

    setFields(fieldsData || []);
  };

  const handleOptionChange = (fieldLabel: string, value: string) => {
    const updatedSelections = { ...formSelections, [fieldLabel]: value };
    setFormSelections(updatedSelections);

    let extraPrice = 0;
    fields.forEach(field => {
      if (field.type === 'select') {
        const selectedValue = updatedSelections[field.label];
        const optionObj = field.field_options?.find((o: any) => o.label === selectedValue);
        if (optionObj) {
          extraPrice += Number(optionObj.additional_price || 0);
        }
      }
    });

    setTotalPrice((selectedProduct?.base_price || 0) + extraPrice);
  };

  const handleWhatsApp = () => {
    if (!selectedProduct) return;

    const phone = '5210000000000'; // Tu número real de WhatsApp
    
    let clientSelectionsText = '';
    fields.forEach(field => {
      const val = formSelections[field.label];
      if (val) {
        let priceTag = '';
        if (field.type === 'select') {
          const opt = field.field_options?.find((o:any) => o.label === val);
          if (opt && opt.additional_price > 0) priceTag = ` (+ $${opt.additional_price} MXN)`;
        }
        clientSelectionsText += `• *${field.label}:* ${val}${priceTag}%0A`;
      }
    });

    const message = `¡Hola! Me interesa cotizar un pedido personalizado desde la página web. 🛒%0A%0A` +
      `📦 *Producto:* ${selectedProduct.name}%0A` +
      `💰 *Precio Estimado:* $${totalPrice} MXN%0A%0A` +
      `✨ *Personalización:*%0A${clientSelectionsText}%0A` +
      `Por favor me confirman disponibilidad y tiempos de entrega.`;

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <main>
      {/* 1. BARRA DE ANUNCIOS SUPERIOR (Estilo Scatola) */}
      <div className="anuncio text-white text-xs md:text-sm text-center py-2 font-medium tracking-wide">
        ¡Regalos increíbles y personalizados para todos!
      </div>

      {/* 2. HEADER PRINCIPAL */}
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center px-4 md:px-8 py-3 md:py-4 max-w-7xl mx-auto">
          
          {/* IZQUIERDA: Menú Hamburguesa (Móvil) o Buscador (Desktop) */}
          <div className="flex-1 flex items-center justify-start">
            <button 
              className="md:hidden p-2 -ml-2 text-gray-700 hover:text-amber-800 transition-colors"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            {/*<button className="hidden md:flex items-center text-gray-400 hover:text-pink-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>*/}
          </div>

          {/* CENTRO: Logo */}
          <div className="flex-1 flex justify-center">
            <a href="#">
              <Image src={"/logo.png"} width={400} height={250} alt='Momentiva' className="w-32 md:w-40 h-auto object-contain" />
            </a>
          </div>

          {/* DERECHA: Ícono de Bolsa de Regalo (Estilo Tienda) */}
          <div className="flex-1 flex justify-end items-center gap-4">
             <button onClick={handleWhatsApp} className="text-gray-700 hover:text-amber-800 transition-colors flex items-center gap-2">
               <span className="hidden md:block text-sm font-bold">Pedido</span>
               {/* Ícono de Bolsa */}
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
               </svg>
             </button>
          </div>
        </div>

        {/* 3. NAVEGACIÓN DESKTOP (Solo visible en computadora, debajo del logo) */}
        <nav className="hidden md:flex justify-center gap-10 py-3 border-t border-gray-50 text-[13px] font-extrabold text-gray-700 tracking-widest uppercase">
          <a href="#productos" className="hover:text-amber-800 transition-colors">Productos</a>
          <a href="#personaliza" className="hover:text-amber-800 transition-colors">Personaliza</a>
          <a href="#como-funciona" className="hover:text-amber-800 transition-colors">Cómo realizar tu pedido</a>
        </nav>
      </header>

      {/* 4. OVERLAY Y MENÚ LATERAL MÓVIL (DESLIZA DESDE LA IZQUIERDA COMO SCATOLA) */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      />
      
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <Image src={"/logo.png"} alt='Momentiva' height={200} width={200} />
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-amber-800 bg-gray-50 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="flex flex-col overflow-y-auto">
          <a href="#productos" onClick={() => setIsMenuOpen(false)} className="py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-widest border-b border-gray-50 hover:bg-red-50 hover:text-amber-800 transition-colors">
            Productos
          </a>
          <a href="#personaliza" onClick={() => setIsMenuOpen(false)} className="py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-widest border-b border-gray-50 hover:bg-red-50 hover:text-amber-800 transition-colors">
            Personaliza
          </a>
          <a href="#como-funciona" onClick={() => setIsMenuOpen(false)} className="py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-widest border-b border-gray-50 hover:bg-red-50 hover:text-amber-800 transition-colors">
            Cómo realizar tu pedido
          </a>
        </nav>

        <div className="mt-auto p-6 bg-gray-50">
          <a href="#personaliza" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center w-full py-4 bg-amber-800 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform uppercase tracking-wider text-sm">
            Personalizar pedido
          </a>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="hero">
        <div>
          {/*<div className="kicker">Party boxes y globos con regalos personalizados</div>*/}
          <h1>Momentos para <span className="gradient">celebrar</span></h1>
          <p>Creamos globos burbuja personalizados para cualquier celebración. Personaliza colores, frases, regalos y crea un momento inolvidable.</p>
          <div className="hero-actions">
            <a href="#personaliza" className="btn rounded-full bg-[#c99598] text-white hover:bg-[#71402a] transition-colors">Personalizar mi pedido</a>
            <a href="#productos" className="btn bg-white text-[#71402a] secondary hover:bg-[#71402a] hover:text-white transition-colors">Ver productos</a>
          </div>
        </div>
        <div className="hero-collage">
          <div className="photo-card one"><img src="/assets/globo_graduacion_rosa.jpeg" alt="Globo rosa" /></div>
          <div className="photo-card two"><img src="/assets/globo_graduacion_azul.jpeg" alt="Box azul" /></div>
          <div className="badge">Diseños hechos a la medida de cada celebración.</div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona">
        <div className="section-title">
          <h2>Cómo realizar tu pedido</h2>
        </div>
        <div className="steps">
          <div className="step"><div className="num">1</div><strong>Personaliza</strong><p>Selecciona tu producto base, escribe tus frases y elige tus colores o peluches favoritos.</p></div>
          <div className="step"><div className="num">2</div><strong>Confirmamos</strong><p>Validamos contigo el precio final recalculado, la fecha exacta de entrega y stock por WhatsApp.</p></div>
          <div className="step"><div className="num">3</div><strong>Producimos</strong><p>Armamos minuciosamente tu regalo con los viniles, moños y detalles acordados.</p></div>
          <div className="step"><div className="num">4</div><strong>Entregamos</strong><p>Coordinamos el envío directo a domicilio o recolección personal según el horario establecido.</p></div>
        </div>
      </section>

      {/* CATÁLOGO DINÁMICO */}
      <section id="productos">
        <div className="section-title">
          <h2>Elige tu tipo de globo</h2>
          <p>Selecciona la opción más cercana a tu celebración y personaliza los detalles en el formulario.</p>
        </div>
        <div className="cards">
          {loading ? (
            <div className="col-span-2 text-center text-gray-400 py-10">Cargando catálogo dinámico...</div>
          ) : products.length === 0 ? (
            <div className="col-span-2 text-center text-gray-400 py-10">No hay productos activos en el administrador.</div>
          ) : (
            products.map((product) => (
              <article key={product.id} className={`product-card cursor-pointer transition-all ${selectedProduct?.id === product.id ? 'ring-4 ring-[#71402a] scale-[1.01]' : ''}`} onClick={() => handleProductChange(product)}>
                {product.card_image && <Image src={product.card_image} alt={product.name} width={100} height={100} className="w-full h-auto object-cover" />}
                <div className="product-body">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="m-0 text-xl">{product.name}</h3>
                    <span className="text-green-600 font-extrabold text-sm bg-green-50 px-2 py-1 rounded-md whitespace-nowrap">Desde ${product.base_price}</span>
                  </div>
                  <p className="text-sm text-gray-500">{product.description}</p>
                  <a href="#personaliza" className="btn w-full text-center mt-2">Configurar este</a>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* CONFIGURADOR FORMULARIO INTERACTIVO */}
      <section id="personaliza">
        <div className="section-title">
          <h2>Arma tu pedido</h2>
          <p>Este formulario funciona como simulador de pedido. La información puede enviarse por WhatsApp para confirmar precio, disponibilidad y fecha de entrega.</p>
        </div>

        <div className="customizer">
          <div>
            <div className="tabs overflow-x-auto whitespace-nowrap mb-6 flex gap-2">
              {products.map((product) => (
                <button key={product.id} className={`px-5 py-3 rounded-full font-bold text-sm border transition-all ${selectedProduct?.id === product.id ? 'bg-[#c99598] text-white border-transparent' : 'bg-white border-gray-200 text-gray-700'}`} onClick={() => handleProductChange(product)} type="button">
                  {product.name}
                </button>
              ))}
            </div>

            <form id="orderForm" onSubmit={(e) => e.preventDefault()}>
              {selectedProduct && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.map((field) => {
                    const selectedValue = formSelections[field.label];
                    const selectedOptionData = field.type === 'select' ? field.field_options?.find((o:any) => o.label === selectedValue) : null;

                    return (
                      <div key={field.id} className={`flex flex-col gap-2 ${field.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                        <label className="font-extrabold text-gray-900 text-sm flex flex-col gap-2">
                          {field.label}
                          
                          {field.type === 'text' && (
                            <input value={selectedValue || ''} onChange={(e) => handleOptionChange(field.label, e.target.value)} placeholder={field.placeholder || "Escribe aquí..."} className="border border-gray-200 rounded-2xl p-3 bg-gray-50 outline-none focus:border-[#71402a] font-normal w-full" />
                          )}

                          {field.type === 'date' && (
                            <input type="date" min={minDate} value={selectedValue || ''} onChange={(e) => handleOptionChange(field.label, e.target.value)} className="border border-gray-200 rounded-2xl p-3 bg-gray-50 outline-none focus:border-[#71402a] font-normal w-full cursor-pointer" />
                          )}

                          {field.type === 'textarea' && (
                            <textarea value={selectedValue || ''} onChange={(e) => handleOptionChange(field.label, e.target.value)} placeholder={field.placeholder || "Detalles..."} className="border border-gray-200 rounded-2xl p-3 bg-gray-50 outline-none focus:border-[#71402a] min-h-[80px] resize-y font-normal w-full" />
                          )}

                          {field.type === 'select' && (
                            <div className="flex flex-col gap-3">
                              <select value={selectedValue || ''} onChange={(e) => handleOptionChange(field.label, e.target.value)} className="border border-gray-200 rounded-2xl p-3 bg-gray-50 outline-none focus:border-[#71402a] font-normal w-full">
                                <option value="">-- Selecciona una opción --</option>
                                {field.field_options?.map((opt: any) => (
                                  <option key={opt.id} value={opt.label}>
                                    {opt.label} {opt.additional_price > 0 ? `(+$${opt.additional_price})` : ''}
                                  </option>
                                ))}
                              </select>
                              
                              {selectedOptionData?.preview_image && (
                                <div className="flex items-center gap-3 bg-pink-50/50 p-2 rounded-xl border border-[#bd7e71] w-fit transition-all">
                                  <img src={selectedOptionData.preview_image} alt={selectedValue} className="w-12 h-12 object-cover rounded-lg shadow-sm border border-white" />
                                  <span className="text-xs text-gray-600 font-medium pr-2">Tu elección</span>
                                </div>
                              )}
                            </div>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="btn w-full mt-8" type="button" onClick={handleWhatsApp} disabled={!selectedProduct}>
                Enviar pedido por WhatsApp · ${totalPrice} MXN
              </button>
            </form>
          </div>

          {/* ASIDE DE RESUMEN DE COMPRA */}
          <aside className="preview">
            <h3 className="mb-4 text-xl font-bold">Resumen de tu diseño</h3>
            <div className="bg-white rounded-[26px] p-5 shadow-[0_12px_26px_rgba(70,35,90,0.08)]">
              <div 
                className="h-[320px] rounded-[22px] bg-cover bg-center mb-5 border border-gray-200" 
                style={{ backgroundImage: selectedProduct?.card_image ? `url(${selectedProduct.card_image})` : 'none' }}
              >
                {!selectedProduct?.card_image && <div className="h-full flex items-center justify-center text-gray-300 text-sm">Sin imagen</div>}
              </div>
              
              <div className="flex flex-col gap-2 text-sm text-gray-600 leading-relaxed">
                <p className="m-0"><b className="text-gray-900">Modelo:</b> {selectedProduct?.name}</p>
                <div className="border-t border-gray-100 pt-2 mt-1 flex flex-col gap-1.5">
                  {Object.entries(formSelections).map(([label, val]) => (
                    val && <div key={label} className="text-xs"><b>{label}:</b> {val}</div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-gray-900">
                  <b>Total estimado:</b>
                  <span className="text-lg font-black text-[#71402a]">${totalPrice} MXN</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-gray-500 py-8">
        © 2026 MomentiVA · Momentos para celebrar
      </footer>
    </main>
  );
}