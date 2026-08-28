"use client";

import React from "react";
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
  InstagramLogoIcon
} from "@phosphor-icons/react/dist/ssr";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMainAdminPage = pathname === "/admin";

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
  ];

  return (
    <div className="min-h-screen flex bg-cream font-sans">
      
      {/* Sidebar - Using Berenjena for a strong, elegant contrast */}
      <aside className="w-64 bg-berenjena text-lilaPastel flex flex-col shadow-xl flex-shrink-0">
        <div className="p-8 pb-4 text-center">
          <Link href="/admin" className="block">
            <h2 className="text-3xl font-bold text-cream">Momentiva</h2>
            <span className="text-xs uppercase tracking-widest text-sage mt-1 block">Panel de Control</span>
          </Link>
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
            <SignOutIcon size={22} weight="light" />
            Ir a la Tienda
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header with Dynamic Back Button */}
        <header className="bg-white px-10 py-6 border-b border-lilaPastel flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            {!isMainAdminPage && (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-3 py-1.5 bg-cream hover:bg-lilaPastel/50 text-berenjena rounded-lg font-bold text-sm transition-colors border border-lilaPastel"
              >
                <ArrowLeftIcon size={18} weight="bold" />
                <span>Volver al Panel</span>
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-berenjena">¡Hola, Administradora!</h1>
              <p className="text-gray-500 font-handwriting text-xl -mt-1">Lista para crear momentos inolvidables hoy...</p>
            </div>
          </div>

          <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white">
            M
          </div>
        </header>

        {/* Page Content injected here */}
        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
  );
}