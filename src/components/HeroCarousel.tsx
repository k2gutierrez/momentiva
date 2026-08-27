"use client";

import { useState, useEffect } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";

interface CarouselSlide {
  id: string;
  image_url: string;
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
      <section className="relative w-full bg-berenjena text-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 py-20 md:py-28 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl space-y-6 text-center md:text-left z-10">
            <span className="inline-block bg-terracota/20 text-terracota border border-terracota/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              Regalos con Alma
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-cream leading-tight">
              Cada regalo, un{" "}
              <span className="text-lilaPastel font-handwriting text-5xl md:text-7xl block mt-1">
                momento inolvidable
              </span>
            </h2>
            <p className="text-lg text-lilaPastel/90 leading-relaxed">
              Descubre detalles únicos creados a mano, tazas personalizadas con vista previa 2D y postres deliciosos para sorprender.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
              <a
                href="#catalog"
                className="bg-terracota hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-transform hover:scale-105 text-center"
              >
                Explorar Catálogo
              </a>
              <a
                href="#cup-customizer"
                className="bg-white/10 hover:bg-white/20 text-cream border border-lilaPastel/30 font-bold px-8 py-4 rounded-full transition-colors text-center"
              >
                Diseñar Taza 2D
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
      <div className="relative h-[480px] md:h-[550px] w-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Background Image with Dark Vignette Overlay */}
            <img
              src={slide.image_url}
              alt={slide.title || "Banner Momentiva"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0"></div>

            {/* Slide Content Overlay */}
            <div className="absolute inset-0 max-w-7xl mx-auto px-8 flex items-end mb-10">
              <div className="max-w-xl space-y-6 text-left">
                {/*slide.title && (
                  <span className="inline-block bg-terracota/30 text-lilaPastel border border-terracota/40 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    {slide.title}
                  </span>
                )*/}
                {/*<h2 className="text-4xl md:text-6xl font-bold tracking-tight text-cream leading-tight">
                  Cada regalo, un{" "}
                  <span className="text-lilaPastel font-handwriting text-5xl md:text-7xl block mt-1">
                    momento inolvidable
                  </span>
                </h2>
                <p className="text-base md:text-lg text-lilaPastel/90 leading-relaxed drop-shadow">
                  Sorprende con productos hechos a la medida, entregados directo en Guadalajara, Zapopan y Tlajomulco.
                </p>*/}
                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href="#catalog"
                    className="bg-terracota hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-full shadow-xl transition-transform hover:scale-105"
                  >
                    Explorar Catálogo
                  </a>
                  <a
                    href="#cup-customizer"
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-cream border border-lilaPastel/30 font-bold px-8 py-4 rounded-full transition-colors"
                  >
                    Personalizar
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide Navigation Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-colors"
            aria-label="Anterior"
          >
            <CaretLeftIcon size={24} weight="bold" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-colors"
            aria-label="Siguiente"
          >
            <CaretRightIcon size={24} weight="bold" />
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