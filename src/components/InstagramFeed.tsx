"use client";

import React, { useState } from 'react';
import { PlayCircleIcon, InstagramLogoIcon, CopyIcon } from '@phosphor-icons/react/dist/ssr';

interface InstaPost {
  id: string;
  image_url: string;
  post_url: string;
  is_video: boolean;
  order_index: number;
}

export default function InstagramFeed({ posts = [] }: { posts?: InstaPost[] }) {
  const [showAll, setShowAll] = useState(false);

  // Si no ha dado clic en "Ver más", solo mostramos los primeros 8 elementos
  const displayedPosts = showAll ? posts : posts.slice(0, 8);

  return (
    <section className="bg-white py-16 border-t border-lilaPastel">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h3 className="text-3xl md:text-4xl font-bold text-berenjena">Inspírate con nuestras creaciones</h3>
        </div>

        {/* Profile Info con Hover Effect (SIEMPRE VISIBLE) */}
        <div className="flex items-center gap-4 mb-6 px-2">
          <a 
            href="https://instagram.com/momentiva.gdl" 
            target="_blank" 
            rel="noopener noreferrer"
            title="@momentiva.gdl"
            className="relative w-16 h-16 rounded-full flex items-center overflow-hidden group block bg-violet-950 border border-lilaPastel/50 shadow-sm"
          >
            {/* Imagen normal */}
            <img 
              src="/assets/logo-lila.png" // Tu logo circular morado
              alt="Momentiva GDL" 
              className="w-full transition-opacity duration-300 group-hover:opacity-0" 
            />
            {/* Fondo negro con ícono de insta en Hover */}
            <div className="absolute inset-0 bg-[#0F0F0F] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <InstagramLogoIcon size={32} weight="regular" className="text-white" />
            </div>
          </a>
          <a 
            href="https://instagram.com/momentiva.gdl" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold text-berenjena text-xl hover:text-terracota transition-colors"
          >
            momentiva.gdl
          </a>
        </div>

        {/* Grid Responsive */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1 mb-8">
            {displayedPosts.map((post) => (
              <a 
                key={post.id} 
                href={post.post_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative aspect-square bg-cream group overflow-hidden cursor-pointer"
              >
                <img 
                  src={post.image_url} 
                  alt="Instagram Post" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                
                {/* Ícono de Video o Galería superior derecha */}
                <div className="absolute top-2 right-2 text-white drop-shadow-md opacity-90">
                  {post.is_video ? <PlayCircleIcon size={24} weight="fill" /> : <CopyIcon size={24} weight="bold" />}
                </div>

                {/* Overlay oscuro y Play gigante en Hover */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   {post.is_video && <PlayCircleIcon size={48} weight="fill" className="text-white drop-shadow-lg" />}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-lilaPastel rounded-xl mb-8">
            <p className="text-gray-500 text-sm">Pronto verás nuestras creaciones aquí...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          {!showAll && posts.length > 8 && (
            <button 
              onClick={() => setShowAll(true)}
              className="bg-[#3A243F] hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-md transition-colors text-sm"
            >
              Ver más
            </button>
          )}
          <a 
            href="https://instagram.com/momentiva.gdl" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#C28C77] hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded-md transition-colors text-sm"
          >
            <InstagramLogoIcon size={20} />
            Síguenos en Insta
          </a>
        </div>

      </div>
    </section>
  );
}