"use client";

import React, { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[4/5] bg-[#F5EFF6] rounded-3xl overflow-hidden shadow-sm">
        <div className="w-full h-full flex items-center justify-center text-sage font-bold">
          Sin imagen
        </div>
      </div>
    );
  }

  const current = images[Math.min(selectedIndex, images.length - 1)];

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <div className="relative aspect-[4/5] bg-[#F5EFF6] rounded-3xl overflow-hidden shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Image
          src={current}
          alt={name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Miniaturas (si hay más de una foto) */}
      {images.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                idx === selectedIndex
                  ? "border-terracota shadow-md"
                  : "border-lilaPastel opacity-70 hover:opacity-100"
              }`}
              aria-label={`Ver foto ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image
                src={src}
                alt={`${name} - foto ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
