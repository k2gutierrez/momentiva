"use client";

import { useState } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { authModalOpenAtom, userAtom, userProfileAtom } from "@/store/authStore";
import { ShoppingCartIcon, UserIcon, ShieldCheckIcon, SignOutIcon, HeartIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cartOpenAtom, cartTotalCountAtom } from "@/store/cartStore";

export default function Header() {
  const setAuthModalOpen = useSetAtom(authModalOpenAtom);
  const [user] = useAtom(userAtom);
  const [profile] = useAtom(userProfileAtom);
  const [menuOpen, setMenuOpen] = useState(false);

  const setCartOpen = useSetAtom(cartOpenAtom);
  const cartCount = useAtomValue(cartTotalCountAtom);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    toast.success("Sesión cerrada correctamente");
  };

  return (
    <header className="bg-white px-8 py-5 shadow-sm sticky top-0 z-40 border-b border-lilaPastel flex justify-between items-center">
      {/* Brand Logo */}
      <Link href="/" className="flex flex-col">
        {/*<h1 className="text-3xl font-bold text-berenjena tracking-tight">Momentiva</h1>
        <span className="text-sage font-handwriting text-lg leading-none -mt-1">
          cada regalo, un momento inolvidable
        </span>*/}
        <img src={"/logo.png"} alt="Momentiva" width={200} height={60} />
      </Link>

      {/* Navigation & Actions */}
      <div className="flex items-center gap-6">

        {/* ADMIN PANEL BUTTON (Visible only if user profile is admin) */}
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-2 bg-berenjena text-lilaPastel hover:bg-opacity-90 px-4 py-2 rounded-full transition-colors font-bold text-sm shadow-sm"
          >
            <ShieldCheckIcon size={20} weight="fill" className="text-sage" />
            <span className="text-white">Panel Admin</span>
          </Link>
        )}

        {/* Wishlist Button */}
        {user && (
          <button className="text-berenjena hover:text-terracota transition-colors p-2" title="Lista de Deseos">
            <HeartIcon size={24} weight="light" />
          </button>
        )}

        {/* Cart Button */}
        <button
          onClick={() => setCartOpen(true)}
          className="flex items-center gap-2 bg-sage/10 text-sage hover:bg-sage/20 px-4 py-2 rounded-full transition-colors font-bold relative"
        >
          <ShoppingCartIcon size={24} weight="light" />
          <span>({cartCount})</span>
        </button>

        {/* AUTH STATE BUTTONS */}
        {user ? (
          /* Logged In State: Avatar / Dropdown */
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 text-berenjena font-bold hover:text-terracota transition-colors focus:outline-none"
            >
              <div className="w-9 h-9 bg-sage/20 text-sage rounded-full flex items-center justify-center font-bold border border-sage/30">
                {profile?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="hidden md:inline text-sm">
                ¡Hola, {profile?.full_name?.split(" ")[0] || "Cliente"}!
              </span>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white border border-lilaPastel rounded-2xl shadow-xl py-2 z-50 animate-fade-in-up">
                <div className="px-4 py-2 border-b border-lilaPastel/50">
                  <p className="text-xs text-gray-400">Iniciado como</p>
                  <p className="text-sm font-bold text-berenjena truncate">{user.email}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 font-bold hover:bg-red-50 flex items-center gap-2 transition-colors mt-1"
                >
                  <SignOutIcon size={18} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Logged Out State: Open Auth Modal */
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-2 text-berenjena hover:text-terracota transition-colors font-bold"
          >
            <UserIcon size={24} weight="light" />
            <span className="hidden md:inline">Iniciar Sesión</span>
          </button>
        )}

      </div>
    </header>
  );
}