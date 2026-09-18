"use client";

import { useState, useEffect } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";

interface CarouselSlide {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  title: string | null;
  order_index: number;
}

export default function HeroCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate slides every 5 seconds if there are multiple active slides
  useEffect(() => {
    if (!slides || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  // Fallback hero if no active slides are uploaded yet
  if (!slides || slides.length === 0) {
    return (
      <section className="relative w-full overflow-hidden bg-berenjena">
        {/* Banner de marca local como fondo */}
        <img
          src="/assets/Banner1.svg"
          alt="Banner Momentiva"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative max-w-7xl mx-auto px-8 py-8 md:py-10 flex flex-col items-center justify-end h-[260px] md:h-[340px]">
          <div className="max-w-xl w-full space-y-5 text-center pb-6 md:pb-10 z-10">
            <p className="hidden sm:block text-lg md:text-xl text-white font-bold drop-shadow-md leading-relaxed">
              Momentos que se quedan por más tiempo. Regalos personalizados y globos burbuja con aire —no helio— que acompañan tus celebraciones por semanas. Entregamos en Guadalajara, Zapopan y Tlajomulco de Zúñiga.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4 justify-center">
              <a
                href="#catalog"
                className="bg-terracota hover:bg-opacity-90 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg transition-transform hover:scale-105 text-center text-sm sm:text-base"
              >
                Explorar catálogo
              </a>
              <a
                href="/tienda?categoria=personalizados"
                className="bg-[#3B2142] hover:bg-[#2A1730] text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg transition-transform hover:scale-105 text-center text-sm sm:text-base"
              >
                Personalizar
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-berenjena overflow-hidden text-cream">
      {/* Banner Slide Container */}
      <div className="relative h-[260px] md:h-[340px] w-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Background Image: <picture> para que el celular NO descargue
                también el banner de escritorio (antes bajaba los dos) */}
            <picture>
              {slide.mobile_image_url && (
                <source media="(max-width: 767px)" srcSet={slide.mobile_image_url} />
              )}
              <img
                src={slide.image_url}
                alt={slide.title || "Banner Momentiva"}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            </picture>
          </div>
        ))}
      </div>

      {/* Botones del banner: UNA sola capa para todos los banners.
          Antes cada banner pintaba los suyos y durante el fundido se veían
          los dos encimados (el "se vio raro" de la captura). */}
      <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-8 flex items-end mb-16 md:mb-10 z-20 pointer-events-none">
        <div className="flex flex-wrap gap-3 sm:gap-4 pointer-events-auto">
          <a
            href="#catalog"
            className="bg-terracota hover:bg-opacity-90 text-white font-bold text-sm sm:text-base px-5 py-3 sm:px-8 sm:py-4 rounded-full shadow-xl transition-transform hover:scale-105"
          >
            Explorar catálogo
          </a>
          <a
            href="/tienda?categoria=personalizados"
            className="bg-[#3B2142] hover:bg-[#2A1730] text-white font-bold text-sm sm:text-base px-5 py-3 sm:px-8 sm:py-4 rounded-full shadow-xl transition-transform hover:scale-105"
          >
            Personalizar
          </a>
        </div>
      </div>

      {/* Slide Navigation Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 bottom-4 md:left-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-30 p-2 md:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-colors"
            aria-label="Anterior"
          >
            <CaretLeftIcon size={20} weight="bold" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 bottom-4 md:right-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-30 p-2 md:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-colors"
            aria-label="Siguiente"
          >
            <CaretRightIcon size={20} weight="bold" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-8 bg-terracota" : "w-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}