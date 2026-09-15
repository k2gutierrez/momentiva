"use client";

import React, { useState, useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { userAtom, userProfileAtom, authModalOpenAtom, type UserProfile } from "@/store/authStore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { PackageIcon, UserIcon, SignOutIcon, LockKeyIcon, CalendarBlankIcon, FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  product: { name: string; images: string[] | null } | null;
}

interface OrderRow {
  id: string;
  status: string;
  total_amount: number;
  delivery_date: string | null;
  created_at: string;
  order_items: OrderItemRow[] | null;
  delivery_address: { deliveryTime?: string } | null;
}

export default function MiCuentaPage() {
  const [user] = useAtom(userAtom);
  const [profile, setProfile] = useAtom(userProfileAtom);
  const setAuthModalOpen = useSetAtom(authModalOpenAtom);

  const [activeTab, setActiveTab] = useState<"perfil" | "pedidos">("perfil");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Formulario de perfil
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      setIsLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          total_amount,
          delivery_date,
          created_at,
          delivery_address,
          order_items (
            quantity,
            unit_price,
            product:products (name, images)
          )
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Error al cargar tus pedidos");
      } else {
        setOrders((data as unknown as OrderRow[]) || []);
      }
      setIsLoadingOrders(false);
    };

    if (user && activeTab === "pedidos") {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  // Sincronizar el formulario cuando cambia el perfil
  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setBirthDate(profile?.birth_date || "");
    setAddress(profile?.address || "");
  }

  // Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada correctamente");
    router.push("/");
  };

  // Guardar datos del perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          birth_date: birthDate || null,
          address: address.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      const updated: UserProfile = {
        full_name: fullName.trim() || user.email || "",
        role: profile?.role || "client",
        phone: phone.trim() || null,
        birth_date: birthDate || null,
        address: address.trim() || null,
      };
      setProfile(updated);
      toast.success("Tus datos se guardaron correctamente");
    } catch (error) {
      toast.error("No se pudieron guardar los datos: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Traductor visual de estados del pedido
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      placed: { label: "Recibido", color: "bg-blue-100 text-blue-700 border-blue-200" },
      work_in_progress: { label: "En Preparación", color: "bg-orange-100 text-orange-700 border-orange-200" },
      finish: { label: "Listo", color: "bg-purple-100 text-purple-700 border-purple-200" },
      delivered: { label: "Entregado", color: "bg-green-100 text-green-700 border-green-200" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
    };
    const current = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-700" };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${current.color}`}>
        {current.label}
      </span>
    );
  };

  return (
    <main className="bg-[#F5EFF6] min-h-screen flex flex-col">
      <AuthModal />
      <Header />

      <section className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-8 py-12 md:py-20">

        {!user ? (
          /* ESTADO: NO LOGUEADO */
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center max-w-xl mx-auto animate-fade-in-up">
            <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-6 text-terracota">
              <LockKeyIcon size={40} weight="light" />
            </div>
            <h2 className="text-3xl font-bold text-[#3A243F] mb-3">Acceso a Mi Cuenta</h2>
            <p className="text-gray-500 mb-8">
              Inicia sesión o regístrate para gestionar tus pedidos, guardar tus datos y ver tu historial de compras.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-terracota hover:bg-opacity-90 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              Iniciar Sesión / Registrarme
            </button>
          </div>
        ) : (
          /* ESTADO: LOGUEADO (DASHBOARD) */
          <div className="flex flex-col md:flex-row gap-8 items-start animate-fade-in-up">

            {/* MENÚ LATERAL */}
            <aside className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-3xl shadow-sm overflow-hidden sticky top-24">
              <div className="p-6 bg-cream text-center border-b border-lilaPastel">
                <div className="w-20 h-20 bg-sage/20 text-sage rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold border-2 border-white shadow-sm">
                  {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <h3 className="font-bold text-[#3A243F] text-lg">{profile?.full_name || "Cliente"}</h3>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>

              <div className="flex flex-col p-2">
                <button
                  onClick={() => setActiveTab("perfil")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${
                    activeTab === "perfil" ? "bg-lilaPastel/20 text-terracota" : "text-[#3A243F] hover:bg-cream"
                  }`}
                >
                  <UserIcon size={20} weight={activeTab === "perfil" ? "fill" : "regular"} />
                  Detalles de la Cuenta
                </button>
                <button
                  onClick={() => setActiveTab("pedidos")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${
                    activeTab === "pedidos" ? "bg-lilaPastel/20 text-terracota" : "text-[#3A243F] hover:bg-cream"
                  }`}
                >
                  <PackageIcon size={20} weight={activeTab === "pedidos" ? "fill" : "regular"} />
                  Mis Pedidos
                </button>
                <div className="h-px bg-lilaPastel/50 my-2 mx-4"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold text-red-500 hover:bg-red-50"
                >
                  <SignOutIcon size={20} />
                  Cerrar Sesión
                </button>
              </div>
            </aside>

            {/* ÁREA DE CONTENIDO */}
            <div className="w-full md:w-2/3 lg:w-3/4">

              {/* PESTAÑA PERFIL */}
              {activeTab === "perfil" && (
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-10">
                  <h2 className="text-2xl font-bold text-[#3A243F] mb-6">Detalles de la Cuenta</h2>

                  <form onSubmit={handleSaveProfile} className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-bold text-[#3A243F] mb-2">Nombre Completo</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-gray-700 focus:outline-none focus:ring-2 focus:ring-terracota"
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#3A243F] mb-2">Correo Electrónico</label>
                      <input
                        type="email"
                        readOnly
                        value={user.email || ""}
                        className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/50 text-gray-500 focus:outline-none cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar desde aquí.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#3A243F] mb-2">Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-gray-700 focus:outline-none focus:ring-2 focus:ring-terracota"
                        placeholder="Ej. 33 1234 5678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#3A243F] mb-2">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-gray-700 focus:outline-none focus:ring-2 focus:ring-terracota"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#3A243F] mb-2">Dirección de Entrega</label>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-gray-700 focus:outline-none focus:ring-2 focus:ring-terracota resize-y"
                        placeholder="Calle, número, colonia, municipio y C.P."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="flex items-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md"
                    >
                      <FloppyDiskIcon size={20} weight="bold" />
                      {isSavingProfile ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </form>
                </div>
              )}

              {/* PESTAÑA PEDIDOS */}
              {activeTab === "pedidos" && (
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-10">
                  <h2 className="text-2xl font-bold text-[#3A243F] mb-6">Historial de Pedidos</h2>

                  {isLoadingOrders ? (
                    <div className="text-center py-10 text-sage font-bold animate-pulse">
                      Cargando tus pedidos...
                    </div>
                  ) : orders.length === 0 ? (
                    /* Empty State de Pedidos */
                    <div className="text-center py-16 px-4 bg-cream/30 rounded-2xl">
                      <PackageIcon size={48} className="mx-auto mb-4 text-lilaPastel" weight="light" />
                      <h3 className="text-lg font-bold text-[#3A243F] mb-2">Aún no tienes pedidos</h3>
                      <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                        Cuando realices una compra, aparecerá aquí todo el detalle y el estado de entrega de tu pedido.
                      </p>
                      <Link
                        href="/tienda"
                        className="bg-terracota hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm inline-block"
                      >
                        Explorar Tienda
                      </Link>
                    </div>
                  ) : (
                    /* Lista de Pedidos Reales */
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-lilaPastel rounded-2xl p-5 md:p-6 hover:shadow-md transition-shadow">

                          {/* Cabecera del Pedido */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-lilaPastel/50">
                            <div>
                              <p className="text-xs text-gray-400 font-mono mb-1">Pedido #{order.id.split("-")[0].toUpperCase()}</p>
                              <div className="flex items-center gap-2">
                                <CalendarBlankIcon size={16} className="text-sage" />
                                <span className="text-sm font-bold text-[#3A243F]">
                                  Entrega: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "Por confirmar"}
                                  {order.delivery_address?.deliveryTime ? ` · ${order.delivery_address.deliveryTime}` : ""}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {getStatusBadge(order.status)}
                              <span className="font-bold text-terracota text-lg">
                                ${Number(order.total_amount).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Lista de Artículos */}
                          <div className="space-y-3">
                            {(order.order_items || []).map((item, idx) => {
                              const product = item.product;
                              const image = product?.images?.[0] || "/placeholder.png";
                              return (
                                <div key={idx} className="flex items-center gap-4 bg-cream/30 p-3 rounded-xl border border-lilaPastel/30">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={image} alt={product?.name || "Producto"} className="w-12 h-12 rounded-lg object-cover" />
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-[#3A243F]">{product?.name || "Producto no disponible"}</p>
                                    <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}

      </section>

      <Footer />
    </main>
  );
}
