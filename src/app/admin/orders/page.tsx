"use client";

import React, { useEffect, useState } from "react";
import { ClipboardTextIcon, PlusIcon, CheckCircleIcon, ClockIcon, TruckIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus, createOfflineSale } from "@/actions/orders";
import { toast } from "sonner";

type OrderStatus = 'placed' | 'work_in_progress' | 'finish' | 'delivered';

/**
 * Las fotos nuevas se guardan como ruta dentro del bucket privado y se sirven por
 * esta ruta interna (solo administradores). Las fotos viejas quedaron como data URL
 * dentro del pedido, así que se siguen mostrando tal cual (compatibilidad).
 */
function urlFoto(valor: string, descargar = false): string {
  // Base64 de pedidos antiguos
  if (valor.startsWith("data:image/")) return valor;

  // Solo se permiten enlaces de nuestro propio almacenamiento: así el navegador
  // del administrador no carga recursos de dominios ajenos (fuga de IP/referrer).
  if (/^https?:\/\//i.test(valor)) {
    return valor.includes(".supabase.co/") ? valor : "";
  }

  // Ruta dentro del bucket privado -> se sirve por la ruta protegida
  return `/admin/pedidos/foto?ruta=${encodeURIComponent(valor)}${descargar ? "&descargar=1" : ""}`;
}

interface OrderRow {
  id: string;
  status: string;
  total_amount: number;
  total_cost: number;
  delivery_date: string;
  is_offline_sale: boolean;
  payment_status?: string | null;
  profiles: { full_name: string; email: string } | null;
  delivery_address: {
    customer_name?: string;
    fullName?: string;
    phone?: string;
    deliveryTime?: string;
    municipality?: string;
    streetAddress?: string;
    notes?: string;
    zip_code?: string;
    /** Fecha y hora que había elegido el cliente en cada producto del carrito. */
    fechasPorProducto?: { name: string; fecha: string; hora?: string }[];
    /** Quien envía el regalo. */
    remitente?: { nombre?: string; telefono?: string };
    /** Quien recibe el regalo. */
    destinatario?: { nombre?: string; telefono?: string; direccion?: string };
    /** Regalo sorpresa. */
    esSorpresa?: boolean;
  } | null;
  order_items:
    | {
        quantity: number;
        unit_price: number;
        selected_options: Record<string, unknown> | null;
        custom_cup_image_url: string | null;
        product: { name: string }[] | null;
      }[]
    | null;
}

interface OfflineProduct {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  is_in_stock_item: boolean | null;
  stock_quantity: number | null;
}

interface OfflineLine {
  key: string;
  productId: string;
  quantity: string;
  unitPrice: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offlineProducts, setOfflineProducts] = useState<OfflineProduct[]>([]);
  const [offlineLines, setOfflineLines] = useState<OfflineLine[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOrders = async (): Promise<OrderRow[]> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select(
        "*, profiles(full_name, email), order_items(quantity, unit_price, selected_options, custom_cup_image_url, product:products(name))"
      )
      .order("created_at", { ascending: false });

    return (data as unknown as OrderRow[]) ?? [];
  };

  const refreshOrders = async () => {
    setIsLoading(true);
    setOrders(await loadOrders());
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setOrders(await loadOrders());
      setIsLoading(false);
    };
    fetchOrders();
  }, []);

  // Productos activos para el formulario de venta externa
  useEffect(() => {
    if (!isModalOpen) return;

    let cancelado = false;
    const cargarProductos = async () => {
      setIsLoadingProducts(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, is_active, is_in_stock_item, stock_quantity")
        .eq("is_active", true)
        .order("name");

      if (cancelado) return;
      if (error) toast.error("No se pudieron cargar los productos");
      setOfflineProducts((data as OfflineProduct[]) ?? []);
      setIsLoadingProducts(false);
    };

    cargarProductos();
    return () => {
      cancelado = true;
    };
  }, [isModalOpen]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      toast.success("Estado de orden actualizado");
      refreshOrders();
    } else {
      toast.error("Error al actualizar el estado");
    }
  };

  const nuevaLinea = (): OfflineLine => ({
    key:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId: "",
    quantity: "1",
    unitPrice: "",
  });

  const abrirModalVenta = () => {
    setOfflineLines([nuevaLinea()]);
    setIsModalOpen(true);
  };

  const actualizarLinea = (key: string, cambios: Partial<OfflineLine>) => {
    setOfflineLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...cambios } : l)));
  };

  const cambiarProductoDeLinea = (key: string, productId: string) => {
    const producto = offlineProducts.find((p) => p.id === productId);
    actualizarLinea(key, {
      productId,
      unitPrice: producto ? String(producto.price ?? "") : "",
    });
  };

  const agregarLinea = () => {
    setOfflineLines((prev) => [...prev, nuevaLinea()]);
  };

  const quitarLinea = (key: string) => {
    setOfflineLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  };

  const totalVenta = offlineLines.reduce(
    (suma, linea) => suma + (Number(linea.unitPrice) || 0) * (Number(linea.quantity) || 0),
    0
  );

  const handleOfflineSaleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const customerName = String(formData.get("customerName") || "").trim();
    const deliveryDate = String(formData.get("deliveryDate") || "");
    const notes = String(formData.get("notes") || "").trim();

    const items = offlineLines
      .filter((linea) => linea.productId)
      .map((linea) => ({
        productId: linea.productId,
        quantity: Math.floor(Number(linea.quantity)),
        unitPrice: Math.round((Number(linea.unitPrice) || 0) * 100) / 100,
      }));

    if (items.length === 0) {
      toast.error("Agrega al menos un producto a la venta.");
      return;
    }
    if (!customerName) {
      toast.error("Escribe el nombre del cliente.");
      return;
    }
    if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity < 1)) {
      toast.error("Revisa las cantidades: deben ser al menos 1.");
      return;
    }
    if (items.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
      toast.error("Revisa los precios: no pueden ser negativos.");
      return;
    }

    setIsSubmitting(true);
    const result = await createOfflineSale({ customerName, deliveryDate, notes, items });
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Venta externa registrada correctamente");
      setIsModalOpen(false);
      setOfflineLines([nuevaLinea()]);
      form.reset();
      refreshOrders();
    } else {
      toast.error(result.error || "Error al registrar la venta");
    }
  };

  return (
    <div className="animate-fade-in-up">
      
      {/* Header & Offline Sale Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-berenjena">Panel de Órdenes en Vivo</h2>
          <p className="text-gray-500 mt-1">
            Supervisa el estado de producción y entrega de cada pedido.
          </p>
          <p className="text-sm text-berenjena mt-3 bg-[#F5EFF6] rounded-xl px-4 py-2 inline-block">
            💡 Para avanzar un pedido, usa el selector de la columna <strong>Estatus</strong>:
            <strong> 🌸 En preparación → 🚚 En camino / listo → ✅ Entregado</strong>
          </p>
        </div>
        <button 
          onClick={abrirModalVenta}
          className="flex items-center gap-2 bg-terracota hover:bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-bold"
        >
          <PlusIcon size={20} weight="bold" />
          Registrar Venta Externa
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-lilaPastel overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream/50 text-berenjena text-sm uppercase tracking-wider">
              <th className="p-4 font-bold">ID / Tipo</th>
              <th className="p-4 font-bold">Cliente</th>
              <th className="p-4 font-bold">Total / Margen</th>
              <th className="p-4 font-bold">Fecha de Entrega</th>
              <th className="p-4 font-bold">Estado Actual[cite: 1]</th>
            </tr>
          </thead>
          <tbody className="text-berenjena divide-y divide-lilaPastel/50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando órdenes...</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  <ClipboardTextIcon size={48} className="mx-auto mb-3 text-lilaPastel" weight="light" />
                  <p>No hay órdenes registradas todavía.</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const margin = order.total_amount - order.total_cost;
                const marginPercentage = order.total_amount > 0 ? ((margin / order.total_amount) * 100).toFixed(1) : 0;
                const isExpanded = expandedId === order.id;

                return (
                  <React.Fragment key={order.id}>
                  <tr
                    className="hover:bg-cream/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <td className="p-4">
                      <div className="font-bold text-berenjena text-sm">#{order.id.slice(0, 8)}</div>
                      {order.is_offline_sale ? (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-bold">Venta Externa</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold">Web</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : order.id);
                        }}
                        className="mt-2 block text-xs font-bold text-terracota hover:underline"
                      >
                        {isExpanded ? "▲ Ocultar detalle" : "▼ Ver detalle"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold">{order.profiles?.full_name || order.delivery_address?.fullName || order.delivery_address?.customer_name || "Cliente General"}</div>
                      <div className="text-xs text-gray-500">
                        {order.profiles?.email ||
                          order.delivery_address?.phone ||
                          "Venta mostrador / offline"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-terracota">${order.total_amount.toFixed(2)}</div>
                      <div className="text-xs text-sage font-semibold">Margen: ${margin.toFixed(2)} ({marginPercentage}%)</div>
                      <div className="text-xs mt-0.5 font-bold">
                        {order.payment_status === "paid" ? (
                          <span className="text-green-600">💳 Pagado</span>
                        ) : order.payment_status === "rejected" ? (
                          <span className="text-red-500">❌ Pago rechazado</span>
                        ) : (
                          <span className="text-amber-600">⏳ Pago pendiente</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      <div>{order.delivery_date}</div>
                      {order.delivery_address?.deliveryTime && (
                        <div className="text-xs text-terracota font-bold mt-0.5">
                          ⏰ {order.delivery_address.deliveryTime}
                        </div>
                      )}
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      {/* Status Dropdown selector */}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-terracota ${
                          order.status === 'placed' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          order.status === 'work_in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.status === 'finish' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        <option value="placed">🕐 Pedido recibido (sin pagar)</option>
                        <option value="work_in_progress">🌸 En preparación</option>
                        <option value="finish">🚚 En camino / listo</option>
                        <option value="delivered">✅ Entregado</option>
                      </select>
                    </td>
                  </tr>

                  {/* Detalle completo del pedido (producción y entrega) */}
                  {isExpanded && (
                    <tr key={`detail-${order.id}`}>
                      <td colSpan={5} className="p-6 bg-cream/40">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Artículos y personalización */}
                          <div>
                            <h4 className="font-bold text-berenjena mb-3">🎈 Artículos y personalización</h4>
                            <div className="space-y-3">
                              {(order.order_items || []).map((item, idx) => {
                                const productName =
                                  Array.isArray(item.product) && item.product.length > 0
                                    ? item.product[0].name
                                    : "Producto";
                                return (
                                  <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
                                    <div className="flex justify-between items-start gap-3">
                                      <div>
                                        <p className="font-bold text-berenjena text-sm">{productName}</p>
                                        <p className="text-xs text-gray-500">Cantidad: {item.quantity} · ${Number(item.unit_price).toFixed(2)} c/u</p>
                                      </div>
                                      <span className="font-bold text-terracota text-sm">
                                        ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                                      </span>
                                    </div>

                                    {/* Opciones elegidas */}
                                    {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {Object.entries(item.selected_options).map(([key, value]) => {
                                          if (value === undefined || value === false || value === "") return null;
                                          return (
                                            <p key={key} className="text-xs text-gray-600">
                                              <span className="font-bold">{key}:</span>{" "}
                                              {Array.isArray(value) ? (
                                                <span className="flex flex-wrap gap-2 mt-1">
                                                  {value.map((src, i) => (
                                                    <a
                                                      key={i}
                                                      href={urlFoto(String(src), true)}
                                                      title="Descargar foto"
                                                      className="group relative"
                                                    >
                                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                                      <img src={urlFoto(String(src))} alt={`${key} ${i + 1}`} className="w-14 h-14 rounded-lg object-cover bg-cream border border-lilaPastel" />
                                                      <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-berenjena/80 text-white text-[9px] font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Descargar
                                                      </span>
                                                    </a>
                                                  ))}
                                                </span>
                                              ) : value === true ? (
                                                "Sí"
                                              ) : (
                                                String(value)
                                              )}
                                            </p>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {item.custom_cup_image_url && (
                                      <div className="mt-3 flex items-center gap-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={urlFoto(item.custom_cup_image_url)}
                                          alt="Foto de la taza personalizada"
                                          className="w-24 h-24 rounded-lg object-cover border border-lilaPastel bg-cream"
                                        />
                                        <div className="flex flex-col gap-1">
                                          <span className="text-xs font-bold text-berenjena">Foto de la taza</span>
                                          <a
                                            href={urlFoto(item.custom_cup_image_url, true)}
                                            className="text-xs font-bold text-terracota hover:underline"
                                          >
                                            ⬇ Descargar imagen
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {(!order.order_items || order.order_items.length === 0) && (
                                <p className="text-xs text-gray-500">Sin artículos registrados.</p>
                              )}
                            </div>
                          </div>

                          {/* Datos de entrega */}
                          <div>
                            <h4 className="font-bold text-berenjena mb-3">🚚 Datos de entrega</h4>
                            <div className="bg-white rounded-xl p-4 shadow-sm text-sm space-y-3">
                              {/* Quién recibe y quién envía, para el reparto */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-lg border border-lilaPastel bg-cream/30 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wider text-sage mb-1">
                                    Recibe
                                  </p>
                                  <p className="font-bold">
                                    {order.delivery_address?.destinatario?.nombre ||
                                      order.delivery_address?.fullName ||
                                      order.delivery_address?.customer_name ||
                                      "—"}
                                  </p>
                                  <p className="text-gray-600">
                                    {order.delivery_address?.destinatario?.telefono ||
                                      order.delivery_address?.phone ||
                                      "sin teléfono"}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-lilaPastel bg-cream/30 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wider text-sage mb-1">
                                    Envía
                                  </p>
                                  <p className="font-bold">
                                    {order.delivery_address?.remitente?.nombre || "—"}
                                  </p>
                                  <p className="text-gray-600">
                                    {order.delivery_address?.remitente?.telefono || "sin teléfono"}
                                  </p>
                                </div>
                              </div>

                              {order.delivery_address?.esSorpresa && (
                                <p className="rounded-lg bg-terracota/10 border border-terracota/40 p-2 font-bold text-berenjena">
                                  🎁 Regalo sorpresa: no revelar el contenido ni el remitente al
                                  entregar. Coordinar con quien envía.
                                </p>
                              )}

                              <p><span className="font-bold">Dirección:</span> {order.delivery_address?.destinatario?.direccion || order.delivery_address?.streetAddress || "—"}</p>
                              <p><span className="font-bold">C.P.:</span> {order.delivery_address?.zip_code || "—"} · {order.delivery_address?.municipality || ""}</p>
                              <p><span className="font-bold">Fecha:</span> {order.delivery_date} {order.delivery_address?.deliveryTime ? `· ${order.delivery_address.deliveryTime}` : ""}</p>
                              {order.delivery_address?.notes && (
                                <p><span className="font-bold">Referencias de la ubicación:</span> {order.delivery_address.notes}</p>
                              )}
                              {Array.isArray(order.delivery_address?.fechasPorProducto) &&
                                new Set(
                                  order.delivery_address.fechasPorProducto.map((f) => f.fecha)
                                ).size > 1 && (
                                  <div className="mt-2 rounded-lg bg-amber-50 border border-amber-300 p-2">
                                    <p className="text-xs font-bold text-amber-900">
                                      ⚠️ Los productos pedían fechas distintas; se unificó a la más lejana.
                                    </p>
                                    {order.delivery_address.fechasPorProducto.map((f, i) => (
                                      <p key={i} className="text-xs text-amber-900">
                                        • {f.name}: {f.fecha} {f.hora ? `· ${f.hora}` : ""}
                                      </p>
                                    ))}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal to Register Offline Sale[cite: 1] */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-berenjena/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-lilaPastel p-8 animate-fade-in-up">
            <h3 className="text-2xl font-bold text-berenjena mb-4 flex items-center gap-2">
              <StorefrontIcon size={24} className="text-terracota" />
              Registrar Venta Externa (Offline)
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Registra una venta hecha fuera de la web con sus productos. El inventario y el margen se actualizan solos.
            </p>

            <form onSubmit={handleOfflineSaleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Nombre del Cliente</label>
                <input type="text" name="customerName" required className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-cream/30 text-berenjena focus:ring-2 focus:ring-terracota" placeholder="Nombre completo" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-berenjena">Productos vendidos</label>
                  <button
                    type="button"
                    onClick={agregarLinea}
                    className="text-sm font-bold text-terracota hover:underline"
                  >
                    + Agregar producto
                  </button>
                </div>

                {isLoadingProducts ? (
                  <p className="text-sm text-gray-500">Cargando productos…</p>
                ) : offlineProducts.length === 0 ? (
                  <p className="text-sm font-semibold text-red-600">
                    No hay productos activos. Activa uno en Productos para poder registrar la venta.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {offlineLines.map((linea) => {
                      const producto = offlineProducts.find((p) => p.id === linea.productId);
                      const stock = producto?.is_in_stock_item
                        ? Math.max(0, Number(producto.stock_quantity) || 0)
                        : null;
                      const cantidad = Number(linea.quantity) || 0;

                      return (
                        <div key={linea.key} className="rounded-xl border border-lilaPastel bg-cream/20 p-3 space-y-2">
                          <div className="flex gap-2">
                            <select
                              value={linea.productId}
                              onChange={(e) => cambiarProductoDeLinea(linea.key, e.target.value)}
                              className="flex-1 px-3 py-2 border border-lilaPastel rounded-lg bg-white text-berenjena focus:ring-2 focus:ring-terracota text-sm"
                            >
                              <option value="">Elige un producto…</option>
                              {offlineProducts.map((p) => {
                                const yaElegido = offlineLines.some(
                                  (l) => l.key !== linea.key && l.productId === p.id
                                );
                                return (
                                  <option key={p.id} value={p.id} disabled={yaElegido}>
                                    {p.name}
                                    {p.is_in_stock_item
                                      ? ` · ${Math.max(0, Number(p.stock_quantity) || 0)} en stock`
                                      : ""}
                                  </option>
                                );
                              })}
                            </select>
                            <button
                              type="button"
                              onClick={() => quitarLinea(linea.key)}
                              disabled={offlineLines.length <= 1}
                              className="px-3 text-gray-400 hover:text-red-500 disabled:opacity-30 font-bold"
                              title="Quitar producto"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-berenjena mb-1">Cantidad</label>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                step={1}
                                value={linea.quantity}
                                onChange={(e) => actualizarLinea(linea.key, { quantity: e.target.value })}
                                className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-white text-berenjena focus:ring-2 focus:ring-terracota text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-berenjena mb-1">Precio unitario ($)</label>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.unitPrice}
                                onChange={(e) => actualizarLinea(linea.key, { unitPrice: e.target.value })}
                                className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-white text-berenjena focus:ring-2 focus:ring-terracota text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {stock !== null && cantidad > stock && (
                            <p className="text-xs font-bold text-red-600">
                              Solo hay {stock} en inventario de este producto.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-cream/50 px-4 py-3">
                <div>
                  <p className="font-bold text-berenjena">Total de la venta</p>
                  <p className="text-xs text-gray-500">
                    El costo interno se calcula solo, con el costo de cada producto.
                  </p>
                </div>
                <p className="text-2xl font-bold text-terracota">${totalVenta.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Fecha de Entrega</label>
                <input type="date" name="deliveryDate" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-cream/30 text-berenjena focus:ring-2 focus:ring-terracota" />
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Notas / Especificaciones</label>
                <textarea name="notes" rows={2} className="w-full px-3 py-2 border border-lilaPastel rounded-lg bg-cream/30 text-berenjena focus:ring-2 focus:ring-terracota" placeholder="Detalles del producto vendido..."></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-lilaPastel">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 font-bold text-gray-500 hover:text-berenjena">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white font-bold px-6 py-2 rounded-lg shadow-md transition-colors">
                  {isSubmitting ? "Registrando..." : "Guardar Venta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}