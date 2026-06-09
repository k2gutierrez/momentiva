"use client";

import { useState } from 'react';

export default function Home() {
  const [productType, setProductType] = useState<'globo' | 'party'>('globo');

  const handleWhatsApp = () => {
    const phone = '5210000000000';
    const message = `Hola, quiero cotizar un pedido...`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <main>
      <header>
        <div className="nav">
          <div className="brand"><div className="mark"></div><span>momenti</span><span>VA</span></div>
          <nav>
            <a href="#productos">Productos</a>
            <a href="#personaliza">Personaliza</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#pedido">Pedido</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div>
          <div className="kicker">Party boxes y globos con regalos personalizados</div>
          <h1>Momentos para <span className="gradient">celebrar</span></h1>
          <p>Creamos cajas temáticas y globos con regalo para cumpleaños, graduaciones y celebraciones especiales. Personaliza colores, frases, regalos, tema, vinil y sabor de pastel desde una sola página.</p>
          <div className="hero-actions">
            <a href="#personaliza" className="btn">Personalizar mi pedido</a>
            <a href="#productos" className="btn secondary">Ver productos</a>
          </div>
        </div>
        <div className="hero-collage">
          {/* Estas imágenes por ahora son estáticas, luego las podemos jalar de Supabase */}
          <div className="photo-card one"><img src="/assets/globo_graduacion_azul.jpeg" alt="Globo personalizado" /></div>
          <div className="photo-card two"><img src="/assets/globo_graduacion_rosa.jpeg" alt="Party box" /></div>
          <div className="badge">Diseños hechos a la medida de cada celebración.</div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos">
        <div className="section-title">
          <h2>Elige tu producto</h2>
          <p>Dos formatos principales para regalar o sorprender: globo transparente con regalo y party box temática con pastel, botanas y decoración.</p>
        </div>
        <div className="cards">
          {/* Tarjeta 1 */}
          <article className="product-card">
            <img src="/globo_graduacion_azul.jpeg" alt="Globo" />
            <div className="product-body">
              <h3>Globo con regalo</h3>
              <p>Ideal para graduaciones, cumpleaños, bienvenida de bebé, aniversarios o detalles especiales. Incluye personalización de frase, color de caja y regalo interior.</p>
              <a href="#personaliza" className="btn">Personalizar globo</a>
            </div>
          </article>
          {/* Tarjeta 2 */}
          <article className="product-card">
            <img src="/party_box_pokemon.jpeg" alt="Party box" />
            <div className="product-body">
              <h3>Party box</h3>
              <p>Caja sorpresa desplegable con tema personalizado, vinil con nombre, pastel, cupcakes, botanas, dulces y decoración de acuerdo con la celebración.</p>
              <a href="#personaliza" className="btn">Personalizar party box</a>
            </div>
          </article>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="section-title">
          <h2>Personalización</h2>
          <p>Cada pedido se adapta al evento, colores, nombre y gustos de la persona festejada.</p>
        </div>
        <div className="features">
          <div className="feature"><strong>Frases y nombres</strong><span>Agrega el mensaje del globo, nombre en vinil o texto especial para la caja.</span></div>
          <div className="feature"><strong>Colores y temas</strong><span>Selecciona paleta, color de caja y temática: graduación, caricaturas, personajes o estilo libre.</span></div>
          <div className="feature"><strong>Regalos y sabores</strong><span>Elige muñeco, dulces, snacks, juguetes, detalles personalizados y sabor de pastel.</span></div>
        </div>
      </section>

      {/* PERSONALIZADOR (FUNNEL) */}
      <section id="personaliza">
        <div className="section-title">
          <h2>Arma tu pedido</h2>
          <p>Este formulario funciona como simulador de pedido. La información puede enviarse por WhatsApp para confirmar precio, disponibilidad y fecha de entrega.</p>
        </div>

        <div className="customizer">
          <div>
            <div className="tabs">
              <button className={`tab ${productType === 'globo' ? 'active' : ''}`} onClick={() => setProductType('globo')} type="button">
                Globo con regalo
              </button>
              <button className={`tab ${productType === 'party' ? 'active' : ''}`} onClick={() => setProductType('party')} type="button">
                Party box
              </button>
            </div>

            <form id="orderForm">
              {productType === 'globo' ? (
                <div id="globoFields" className="grid gap-4">
                  <label className="flex flex-col gap-2 font-extrabold text-gray-900 text-sm">Frase del globo
                    <input className="border border-gray-200 rounded-2xl p-3 bg-gray-50 font-normal outline-none focus:border-pink-500" placeholder="Ej. Feliz cumpleaños..." />
                  </label>
                  <div className="grid-2">
                    <label className="flex flex-col gap-2 font-extrabold text-gray-900 text-sm">Color de caja
                      <select className="border border-gray-200 rounded-2xl p-3 bg-gray-50 font-normal outline-none focus:border-pink-500">
                        <option>Blanca</option><option>Rosa</option><option>Azul</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-2 font-extrabold text-gray-900 text-sm">Color de moño
                      <select className="border border-gray-200 rounded-2xl p-3 bg-gray-50 font-normal outline-none focus:border-pink-500">
                        <option>Rosa mexicano</option><option>Azul rey</option><option>Dorado</option>
                      </select>
                    </label>
                  </div>
                </div>
              ) : (
                <div id="partyFields" className="grid gap-4">
                  <label className="flex flex-col gap-2 font-extrabold text-gray-900 text-sm">Tema de la celebración
                    <select className="border border-gray-200 rounded-2xl p-3 bg-gray-50 font-normal outline-none focus:border-pink-500">
                      <option>Pokémon</option><option>Stitch</option><option>Princesas</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 font-extrabold text-gray-900 text-sm">Extras para incluir
                    <textarea className="border border-gray-200 rounded-2xl p-3 bg-gray-50 font-normal outline-none focus:border-pink-500 min-h-[86px] resize-y" placeholder="Ej. cupcakes, papitas, refrescos..."></textarea>
                  </label>
                </div>
              )}
              <button className="btn mt-6" type="button" onClick={handleWhatsApp}>
                Enviar pedido por WhatsApp
              </button>
            </form>
          </div>

          <aside className="preview">
            <h3>Vista previa del pedido</h3>
            <div className="preview-box">
              <div 
                className="preview-image" 
                style={{ backgroundImage: `url(${productType === 'globo' ? '/globo_graduacion_rosa.jpeg' : '/party_box_pokemon.jpeg'})` }}
              ></div>
              <div className="summary text-gray-500 text-sm leading-relaxed">
                <p><b className="text-gray-900">Producto:</b> {productType === 'globo' ? 'Globo con regalo' : 'Party box'}</p>
                {/* Aquí inyectaremos el resumen dinámico de los campos */}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona">
        <div className="section-title">
          <h2>Cómo funciona</h2>
        </div>
        <div className="steps">
          <div className="step"><div className="num">1</div><strong>Personaliza</strong><p>Selecciona producto, frase, colores o tema.</p></div>
          <div className="step"><div className="num">2</div><strong>Confirmamos</strong><p>Validamos diseño, precio y fecha por WhatsApp.</p></div>
          <div className="step"><div className="num">3</div><strong>Producimos</strong><p>Armamos tu pedido con la paleta acordada.</p></div>
          <div className="step"><div className="num">4</div><strong>Entregamos</strong><p>Coordinamos entrega o recolección.</p></div>
        </div>
      </section>

      {/* CTA */}
      <section id="pedido" className="cta">
        <div>
          <h2 className="text-3xl font-bold mb-4">¿Lista para crear una sorpresa personalizada?</h2>
          <p>Usa el formulario para enviarnos la idea de tu celebración. Te responderemos con propuesta, costo y tiempos.</p>
        </div>
        <a href="#personaliza" className="btn secondary whitespace-nowrap">Iniciar pedido</a>
      </section>

      <footer>
        © 2026 MomentiVA · Momentos para celebrar
      </footer>
    </main>
  );
}