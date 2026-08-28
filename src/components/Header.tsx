"use client";

import { useState } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { authModalOpenAtom, userAtom, userProfileAtom } from "@/store/authStore";
import { ListIcon, XIcon, CaretDownIcon, ShieldCheckIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cartOpenAtom, cartTotalCountAtom } from "@/store/cartStore";

export default function Header() {
  const setAuthModalOpen = useSetAtom(authModalOpenAtom);
  const [user] = useAtom(userAtom);
  const [profile] = useAtom(userProfileAtom);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTiendaOpen, setMobileTiendaOpen] = useState(false);
  const [mobileInicioOpen, setMobileInicioOpen] = useState(false);

  const setCartOpen = useSetAtom(cartOpenAtom);
  const cartCount = useAtomValue(cartTotalCountAtom);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada correctamente");
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-lilaPastel/50">
      
      {/* 1. TOP ROW: Logotipo */}
      <div className="flex justify-between lg:justify-center items-center px-6 py-4 lg:py-6">
        <button 
          className="lg:hidden text-berenjena p-2 focus:outline-none" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <XIcon size={28} /> : <ListIcon size={28} />}
        </button>

        <Link href="/" className="flex flex-col items-center mx-auto lg:mx-0">
          <img src="/logo.png" alt="Momentiva" className="h-10 md:h-16 w-auto object-contain" />
        </Link>

        <div className="w-10 lg:hidden"></div>
      </div>

      {/* 2. BOTTOM ROW: Barra de Navegación Lila (Desktop) */}
      <div className="hidden lg:block bg-[#EBE0EC] border-y border-lilaPastel/30">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
          
          {/* INICIO */}
          <div className="relative group cursor-pointer">
            <Link href="/" className="flex items-center gap-1 text-sm font-bold text-berenjena hover:text-terracota tracking-wider uppercase transition-colors">
              INICIO <CaretDownIcon size={14} weight="bold" />
            </Link>
            <div className="absolute left-0 mt-0 pt-4 w-48 hidden group-hover:block z-50">
              <div className="bg-[#EBE0EC] shadow-lg border border-white">
                <Link href="/conocenos" className="block px-6 py-3 text-xs font-bold text-berenjena hover:text-terracota border-b border-white/50 transition-colors">
                  Conócenos 💖
                </Link>
              </div>
            </div>
          </div>

          {/* TIENDA */}
          <div className="relative group cursor-pointer">
            <Link href="/tienda" className="flex items-center gap-1 text-sm font-bold text-berenjena hover:text-terracota tracking-wider uppercase transition-colors">
              TIENDA <CaretDownIcon size={14} weight="bold" />
            </Link>
            <div className="absolute left-0 mt-0 pt-4 w-48 hidden group-hover:block z-50">
              <div className="bg-[#EBE0EC] shadow-lg border border-white">
                <Link href="/tienda?categoria=personalizados" className="block px-6 py-3 text-xs font-bold text-berenjena hover:text-terracota border-b border-white/50 transition-colors">
                  Personalizados
                </Link>
                <Link href="/tienda?categoria=cumpleanos" className="block px-6 py-3 text-xs font-bold text-berenjena hover:text-terracota border-b border-white/50 transition-colors">
                  Cumpleaños
                </Link>
                <Link href="/tienda?categoria=aniversario" className="block px-6 py-3 text-xs font-bold text-berenjena hover:text-terracota transition-colors">
                  Aniversario
                </Link>
              </div>
            </div>
          </div>

          <Link href="/preguntas-frecuentes" className="text-sm font-bold text-berenjena hover:text-terracota tracking-wider uppercase transition-colors">
            PREGUNTAS FRECUENTES
          </Link>

          <Link href="/cuidados" className="text-sm font-bold text-berenjena hover:text-terracota tracking-wider uppercase transition-colors">
            CUIDADOS
          </Link>

          {/* MI CUENTA (Dinámico) */}
          {user ? (
            <div className="relative group cursor-pointer">
              <Link href="/mi-cuenta" className="flex items-center gap-1 text-sm font-bold text-berenjena hover:text-terracota tracking-wider uppercase transition-colors">
                MI CUENTA <CaretDownIcon size={14} weight="bold" />
              </Link>
              <div className="absolute left-0 mt-0 pt-4 w-48 hidden group-hover:block z-50">
                <div className="bg-[#EBE0EC] shadow-lg border border-white flex flex-col">
                  <Link href="/mi-cuenta" className="px-6 py-3 text-xs font-bold text-berenjena hover:text-terracota border-b border-white/50 transition-colors text-left">
                    Mi Perfil
                  </Link>
                  <button onClick={handleLogout} className="text-left px-6 py-3 text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAuthModalOpen(true)} className="text-sm font-bold text-berenjena hover:text-terracota tracking-wider uppercase transition-colors focus:outline-none">
              MI CUENTA
            </button>
          )}

          <button onClick={() => setCartOpen(true)} className="flex items-center gap-1 text-sm font-bold text-berenjena hover:text-terracota tracking-wider uppercase transition-colors focus:outline-none">
            CARRITO {cartCount > 0 && <span className="text-terracota">({cartCount})</span>}
          </button>

          {/* Panel Admin Desktop */}
          {profile?.role === "admin" && (
            <Link href="/admin" className="flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-terracota tracking-wider uppercase transition-colors">
              <ShieldCheckIcon size={16} /> ADMIN
            </Link>
          )}

        </nav>
      </div>

      {/* 3. MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#EBE0EC] absolute w-full shadow-2xl z-50">
          <nav className="flex flex-col px-6 py-4">
            
            {/* Inicio Mobile */}
            <div className="border-b border-white/50 py-3">
              <button 
                onClick={() => setMobileInicioOpen(!mobileInicioOpen)}
                className="flex items-center justify-between w-full text-sm font-bold text-berenjena uppercase"
              >
                INICIO <CaretDownIcon size={16} className={`transition-transform ${mobileInicioOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileInicioOpen && (
                <div className="flex flex-col pl-4 mt-2 space-y-3">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-xs text-berenjena">Página Principal</Link>
                  <Link href="/conocenos" onClick={() => setMobileMenuOpen(false)} className="text-xs text-berenjena">Conócenos 💖</Link>
                </div>
              )}
            </div>

            {/* Tienda Mobile */}
            <div className="border-b border-white/50 py-3">
              <button 
                onClick={() => setMobileTiendaOpen(!mobileTiendaOpen)}
                className="flex items-center justify-between w-full text-sm font-bold text-berenjena uppercase"
              >
                TIENDA <CaretDownIcon size={16} className={`transition-transform ${mobileTiendaOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileTiendaOpen && (
                <div className="flex flex-col pl-4 mt-2 space-y-3">
                  <Link href="/tienda" onClick={() => setMobileMenuOpen(false)} className="text-xs text-berenjena">Ver Toda la Tienda</Link>
                  <Link href="/tienda?categoria=personalizados" onClick={() => setMobileMenuOpen(false)} className="text-xs text-berenjena">Personalizados</Link>
                  <Link href="/tienda?categoria=cumpleanos" onClick={() => setMobileMenuOpen(false)} className="text-xs text-berenjena">Cumpleaños</Link>
                  <Link href="/tienda?categoria=aniversario" onClick={() => setMobileMenuOpen(false)} className="text-xs text-berenjena">Aniversario</Link>
                </div>
              )}
            </div>

            <Link href="/preguntas-frecuentes" onClick={() => setMobileMenuOpen(false)} className="py-3 text-sm font-bold text-berenjena border-b border-white/50 uppercase">
              PREGUNTAS FRECUENTES
            </Link>

            <Link href="/cuidados" onClick={() => setMobileMenuOpen(false)} className="py-3 text-sm font-bold text-berenjena border-b border-white/50 uppercase">
              CUIDADOS
            </Link>

            {user ? (
              <Link href="/mi-cuenta" onClick={() => setMobileMenuOpen(false)} className="py-3 text-sm font-bold text-berenjena border-b border-white/50 uppercase block">
                MI CUENTA
              </Link>
            ) : (
              <button onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }} className="text-left py-3 text-sm font-bold text-berenjena border-b border-white/50 uppercase">
                MI CUENTA
              </button>
            )}

            <button onClick={() => { setCartOpen(true); setMobileMenuOpen(false); }} className="text-left py-3 text-sm font-bold text-berenjena border-b border-white/50 uppercase">
              CARRITO {cartCount > 0 && `(${cartCount})`}
            </button>

            {/* Panel Admin Mobile */}
            {profile?.role === "admin" && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="py-3 text-sm font-bold text-orange-400 border-b border-white/50 uppercase flex items-center gap-2">
                <ShieldCheckIcon size={18} /> PANEL ADMIN
              </Link>
            )}

            {user && (
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-left py-3 mt-4 text-xs font-bold text-red-500 uppercase flex items-center gap-2">
                <SignOutIcon size={16}/> Cerrar Sesión
              </button>
            )}

          </nav>
        </div>
      )}
    </header>
  );
}