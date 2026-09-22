"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  StorefrontIcon, 
  PackageIcon, 
  CalendarXIcon, 
  TagIcon, 
  SignOutIcon,
  UsersIcon,
  MapPinIcon,
  ArrowLeftIcon, 
  TicketIcon, 
  SlideshowIcon, 
  InstagramLogoIcon, ChartLineUpIcon, ListIcon, XIcon } from "@phosphor-icons/react/dist/ssr";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMainAdminPage = pathname === "/admin";

  // En celular el menú se abre y se cierra (antes ocupaba media pantalla y no había
  // forma de ocultarlo). En pantallas grandes queda fijo como siempre.
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Al entrar a otra sección, el menú se cierra solo
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  const menuItems = [
    { name: "Vista General", href: "/admin", icon: StorefrontIcon },
    { name: "Productos", href: "/admin/products", icon: PackageIcon },
    { name: "Categorías", href: "/admin/categories", icon: TagIcon },
    { name: "Zonas de Envío", href: "/admin/delivery-zones", icon: MapPinIcon },
    { name: "Días Bloqueados", href: "/admin/calendar", icon: CalendarXIcon },
    { name: "Clientes", href: "/admin/clients", icon: UsersIcon },
    { name: "Cupones", href: "/admin/coupons", icon: TicketIcon },
    { name: "Carrusel Banner", href: "/admin/carousels", icon: SlideshowIcon },
    { name: "Feed Instagram", href: "/admin/instagram", icon: InstagramLogoIcon },
    { name: "Conversión", href: "/admin/embudo", icon: ChartLineUpIcon },
  ];

  return (
    <div className="min-h-screen flex bg-cream font-sans">
      
      {/* Sidebar - Using Berenjena for a strong, elegant contrast */}
      {/* Fondo oscuro (solo celular) cuando el menú está abierto */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-berenjena text-lilaPastel flex flex-col shadow-xl flex-shrink-0 transform transition-transform duration-300 md:relative md:translate-x-0 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 pb-4 text-center relative">
          <Link href="/admin" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-blanco.png" alt="Momentiva" className="h-12 md:h-14 w-auto mx-auto object-contain" />
            <span className="text-xs uppercase tracking-widest text-sage mt-2 block">Panel de Control</span>
          </Link>
          <button
            onClick={() => setMenuAbierto(false)}
            className="md:hidden absolute top-4 right-4 p-2 rounded-full text-white/80 hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <XIcon size={20} weight="bold" />
          </button>
        </div>

        <nav className="flex-1 mt-8 space-y-2 px-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-lilaPastel text-berenjena font-bold shadow-sm" 
                    : "hover:bg-white/10 text-white hover:text-white"
                }`}
              >
                <Icon size={22} weight={isActive ? "fill" : "light"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mb-4">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl hover:bg-white/10 hover:text-white transition-colors"
          >
            <StorefrontIcon size={22} weight="light" />
            Ir a la Tienda
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top Header with Dynamic Back Button */}
        <header className="bg-white px-4 md:px-10 py-4 md:py-6 border-b border-lilaPastel flex justify-between items-center gap-3 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            {/* Abrir el menú (solo celular) */}
            <button
              onClick={() => setMenuAbierto(true)}
              className="md:hidden p-2 rounded-lg bg-cream text-berenjena border border-lilaPastel shrink-0"
              aria-label="Abrir menú"
            >
              <ListIcon size={22} weight="bold" />
            </button>
            {!isMainAdminPage && (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-3 py-1.5 bg-cream hover:bg-lilaPastel/50 text-berenjena rounded-lg font-bold text-sm transition-colors border border-lilaPastel"
              >
                <ArrowLeftIcon size={18} weight="bold" />
                <span>Volver al Panel</span>
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-berenjena truncate">
                ¡Hola, Administradora!
              </h1>
              <p className="hidden sm:block text-gray-500 font-handwriting text-xl -mt-1">
                Lista para crear momentos inolvidables hoy...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Volver a la tienda: siempre visible, abre el sitio en otra pestaña
                para no perder lo que se esté haciendo en el panel */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-terracota hover:opacity-90 text-white rounded-xl font-bold text-sm shadow-sm transition-opacity"
            >
              <StorefrontIcon size={18} weight="bold" />
              <span className="hidden sm:inline">Ver la tienda</span>
            </a>

            <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white">
              M
            </div>
          </div>
        </header>

        {/* Page Content injected here */}
        <div className="p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}