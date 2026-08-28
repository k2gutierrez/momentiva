import React from 'react';
import { FacebookLogoIcon, InstagramLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr";

export default function Footer() {
  return (
    <footer className="bg-[#3A243F] text-white py-6 px-4 sm:px-8 border-t border-[#3A243F]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Social Icons */}
        <div className="flex gap-4">
          <a href="#" className="p-2 hover:text-terracota transition-colors" aria-label="Facebook">
            <FacebookLogoIcon size={24} weight="fill" />
          </a>
          <a href="https://instagram.com/momentiva.gdl" className="p-2 hover:text-terracota transition-colors" aria-label="Instagram">
            <InstagramLogoIcon size={24} weight="fill" />
          </a>
          <a href="#" className="p-2 hover:text-terracota transition-colors" aria-label="YouTube">
            <YoutubeLogoIcon size={24} weight="fill" />
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center md:text-right text-sm text-white/90">
          © {new Date().getFullYear()} <strong>Momentiva</strong>. Todos los derechos reservados. Guadalajara, Jal. México
        </div>
        
      </div>
    </footer>
  );
}