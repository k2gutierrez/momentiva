"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  PackageIcon, 
  ClipboardTextIcon, 
  MapPinIcon, 
  CalendarXIcon, 
  TagIcon, 
  CurrencyDollarIcon, 
  TrendUpIcon,
  ArrowRightIcon
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    totalSales: 0,
    totalProfit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();

      // Fetch product count
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Fetch orders
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, total_cost, status");

      let sales = 0;
      let cost = 0;
      let activeCount = 0;

      if (orders) {
        orders.forEach((o) => {
          sales += o.total_amount || 0;
          cost += o.total_cost || 0;
          if (o.status !== "delivered") {
            activeCount++;
          }
        });
      }

      setStats({
        totalProducts: productCount || 0,
        activeOrders: activeCount,
        totalSales: sales,
        totalProfit: sales - cost,
      });

      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const quickLinks = [
    { title: "Gestión de Productos", desc: "Agregar, editar e inventario", href: "/admin/products", icon: PackageIcon, color: "bg-sage/10 text-sage" },
    { title: "Órdenes en Vivo", desc: "Ver pedidos y cambiar estados", href: "/admin/orders", icon: ClipboardTextIcon, color: "bg-terracota/10 text-terracota" },
    { title: "Zonas de Envío", desc: "C.P. y costos de entrega", href: "/admin/delivery-zones", icon: MapPinIcon, color: "bg-berenjena/10 text-berenjena" },
    { title: "Días Bloqueados", desc: "Calendario de disponibilidad", href: "/admin/calendar", icon: CalendarXIcon, color: "bg-amber-100 text-amber-800" },
    { title: "Categorías", desc: "Organizar catálogo", href: "/admin/categories", icon: TagIcon, color: "bg-purple-100 text-purple-800" },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-lilaPastel shadow-sm flex items-center gap-4">
          <div className="p-4 bg-terracota/10 text-terracota rounded-xl">
            <CurrencyDollarIcon size={32} weight="bold" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Ventas Totales</p>
            <p className="text-2xl font-bold text-berenjena">
              {isLoading ? "..." : `$${stats.totalSales.toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-lilaPastel shadow-sm flex items-center gap-4">
          <div className="p-4 bg-sage/20 text-sage rounded-xl">
            <TrendUpIcon size={32} weight="bold" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Ganancia Bruta</p>
            <p className="text-2xl font-bold text-sage">
              {isLoading ? "..." : `$${stats.totalProfit.toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-lilaPastel shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-100 text-amber-800 rounded-xl">
            <ClipboardTextIcon size={32} weight="bold" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Órdenes Activas</p>
            <p className="text-2xl font-bold text-berenjena">
              {isLoading ? "..." : stats.activeOrders}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-lilaPastel shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-100 text-purple-800 rounded-xl">
            <PackageIcon size={32} weight="bold" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Productos</p>
            <p className="text-2xl font-bold text-berenjena">
              {isLoading ? "..." : stats.totalProducts}
            </p>
          </div>
        </div>

      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-2xl font-bold text-berenjena mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white p-6 rounded-2xl border border-lilaPastel hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                    <Icon size={24} weight="bold" />
                  </div>
                  <h4 className="text-xl font-bold text-berenjena group-hover:text-terracota transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-sage group-hover:text-terracota transition-colors">
                  <span>Ir a la sección</span>
                  <ArrowRightIcon size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}