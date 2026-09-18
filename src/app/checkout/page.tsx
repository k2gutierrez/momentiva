"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { cartItemsAtom, cartSubtotalAtom } from "@/store/cartStore";
import { userProfileAtom } from "@/store/authStore";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { processCheckoutOrder, validateCoupon } from "@/actions/checkout";
import { MapPinIcon, CalendarBlankIcon, TicketIcon, CheckCircleIcon, ArrowLeftIcon, CreditCardIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { toast } from "sonner";
import { formatearEntrega, unificarEntrega } from "@/lib/entrega";

interface DeliveryZone {
  id: string;
  zip_code: string;
  municipality: string;
  delivery_cost: number;
  is_available: boolean;
}

export default function CheckoutPage() {
  const [cart, setCart] = useAtom(cartItemsAtom);
  const subtotal = useAtomValue(cartSubtotalAtom);
  const [profile] = useAtom(userProfileAtom);

  // Delivery Zip Code Matrix state
  const [zipCode, setZipCode] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | null>(null);
  const [checkingZip, setCheckingZip] = useState(false);
  const [zipError, setZipError] = useState("");

  // Dates: no se eligen aquí, se calculan a partir de lo que se eligió en cada
  // producto. Un pedido se entrega en UNA sola fecha: gana la más lejana.
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [infoProductos, setInfoProductos] = useState<
    Record<string, { anticipationDays: number } | undefined>
  >({});
  const [aceptaCambio, setAceptaCambio] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Address fields
  // Address fields (prellenados con los datos del perfil si hay sesión iniciada)
  const [fullName, setFullName] = useState(() => profile?.full_name || "");
  const [phone, setPhone] = useState(() => profile?.phone || "");
  const [streetAddress, setStreetAddress] = useState(() => profile?.address || "");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Fetch blocked calendar dates on load
  useEffect(() => {
    const fetchBlockedDates = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("blocked_dates").select("blocked_date");
      if (data) {
        setBlockedDates(data.map((b) => b.blocked_date));
      }
    };
    fetchBlockedDates();
  }, []);

  // Anticipación de cada producto del carrito: hace falta para saber si alguno es
  // de entrega inmediata y para unificar la fecha de entrega del pedido.
  const idsProductos = cart
    .map((i) => i.productId)
    .filter(Boolean)
    .sort()
    .join(",");

  useEffect(() => {
    const fetchAnticipacion = async () => {
      if (!idsProductos) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, anticipation_days")
        .in("id", idsProductos.split(","));
      if (!data) return;
      const mapa: Record<string, { anticipationDays: number }> = {};
      data.forEach((p) => {
        mapa[p.id] = { anticipationDays: Number(p.anticipation_days) || 0 };
      });
      setInfoProductos(mapa);
    };
    fetchAnticipacion();
  }, [idsProductos]);

  // Fecha y horario finales del pedido (calculados, no elegidos aquí)
  const entrega = useMemo(
    () => unificarEntrega(cart, infoProductos),
    [cart, infoProductos]
  );
  const deliveryDate = entrega.fecha;
  const deliveryTime = entrega.hora;
  const fechaBloqueada = Boolean(deliveryDate) && blockedDates.includes(deliveryDate);
  const faltaInfoProductos = cart.some((i) => !infoProductos[i.productId]);
  const puedePagar =
    Boolean(deliveryZone) &&
    Boolean(deliveryDate) &&
    Boolean(deliveryTime) &&
    !fechaBloqueada &&
    entrega.sinFecha.length === 0 &&
    (!entrega.requiereAceptacion || aceptaCambio);

  // Validate Zip Code against delivery_zones table
  const handleCheckZip = async () => {
    if (zipCode.length !== 5) {
      setZipError("El código postal debe ser de 5 dígitos.");
      return;
    }

    setCheckingZip(true);
    setZipError("");
    setDeliveryZone(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("zip_code", zipCode)
      .eq("is_available", true)
      .single();

    if (error || !data) {
      setZipError("Lo sentimos, aún no tenemos cobertura de entrega en este código postal.");
    } else {
      setDeliveryZone(data as DeliveryZone);
      toast.success(`Cobertura confirmada: ${data.municipality} ($${data.delivery_cost} MXN)`);
    }

    setCheckingZip(false);
  };

  // Handle Coupon Application
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const res = await validateCoupon(couponInput, subtotal);
    if (res.valid) {
      setDiscountAmount(res.discount || 0);
      setAppliedCoupon(res.code || couponInput);
      toast.success(`Cupón "${res.code}" aplicado correctamente`);
    } else {
      toast.error(res.error || "Error al aplicar cupón");
    }
  };

  // Final submit
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryZone) {
      toast.error("Por favor valida un código postal con cobertura.");
      return;
    }

    if (entrega.sinFecha.length > 0) {
      toast.error(
        `Falta elegir la fecha de entrega de: ${entrega.sinFecha.join(", ")}. Vuelve a ese producto para elegirla.`
      );
      return;
    }

    if (!deliveryDate) {
      toast.error("Falta la fecha de entrega de tus productos.");
      return;
    }

    if (blockedDates.includes(deliveryDate)) {
      toast.error(
        "La fecha de entrega de tus productos no está disponible. Vuelve al producto y elige otra."
      );
      return;
    }

    if (!deliveryTime) {
      toast.error("Falta el horario de entrega de tus productos.");
      return;
    }

    if (entrega.requiereAceptacion && !aceptaCambio) {
      toast.error("Marca la casilla para aceptar la fecha de entrega del pedido.");
      return;
    }

    setIsSubmitting(true);

    const deliveryFee = deliveryZone.delivery_cost || 0;
    const totalAmount = Math.max(0, subtotal - discountAmount) + deliveryFee;
    
    // Estimate gross cost placeholder for margins
    const totalCost = subtotal * 0.4; 

    const result = await processCheckoutOrder({
      deliveryZipCode: zipCode,
      deliveryAddress: {
        fullName,
        phone,
        streetAddress,
        notes,
        municipality: deliveryZone.municipality,
        zoneName: deliveryZone.municipality,
        deliveryTime,
        // Fechas que había elegido el cliente en cada producto. Sirve para que en
        // el panel se vea de dónde salió la fecha unificada del pedido.
        fechasPorProducto: entrega.detalle.map((d) => ({
          name: d.nombre,
          fecha: d.fecha,
          hora: d.hora || undefined,
        })),
      },
      deliveryDate,
      couponCode: appliedCoupon || undefined,
      discountAmount,
      deliveryFee,
      subtotal,
      totalAmount,
      totalCost,
      cartItems: cart,
      origin: window.location.origin,
    });

    if (result.success) {
      if (result.initPoint) {
        // El carrito se limpia en la página de resultado del pago (ClearCartOnMount),
        // así la redirección a Mercado Pago es inmediata y sin parpadeos.
        toast.success("Pedido registrado. Te llevamos a Mercado Pago para pagar...");
        window.location.href = result.initPoint;
        return;
      }

      toast.error(
        "Tu pedido se registró, pero no se pudo iniciar el pago: " +
          (result.warning || "inténtalo de nuevo o contáctanos por WhatsApp.")
      );
    } else {
      toast.error(result.error || "Error al procesar el pedido");
    }

    setIsSubmitting(false);
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-8 py-20 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-sage/20 text-sage rounded-full flex items-center justify-center mb-6">
            <CheckCircleIcon size={48} weight="fill" />
          </div>
          <h2 className="text-4xl font-bold text-berenjena mb-2">¡Muchas gracias por tu compra!</h2>
          <p className="text-gray-600 text-lg mb-8">
            Hemos recibido tu pedido correctamente. Nos pondremos en contacto contigo para coordinar la entrega.
          </p>
          <Link
            href="/"
            className="bg-terracota hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Volver a la Tienda
          </Link>
        </main>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <main className="flex-1 max-w-md mx-auto px-8 py-20 text-center flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-berenjena mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-500 mb-6">Agrega productos al carrito antes de proceder al pago.</p>
          <Link href="/" className="bg-terracota text-white font-bold px-6 py-3 rounded-full">
            Ver Productos
          </Link>
        </main>
      </div>
    );
  }

  const deliveryFee = deliveryZone ? deliveryZone.delivery_cost : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount) + deliveryFee;

  return (
    <div className="min-h-screen bg-cream font-sans pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-8 py-12 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-full text-sage hover:bg-lilaPastel transition-colors shadow-sm">
            <ArrowLeftIcon size={24} />
          </Link>
          <h2 className="text-3xl font-bold text-berenjena">Finalizar Compra</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Form (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. ZIP CODE COVERAGE VALIDATOR */}
            <div className="bg-white p-8 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-berenjena flex items-center gap-2 pb-3">
                <MapPinIcon size={24} className="text-terracota" />
                1. Cobertura de Envío (C.P.)
              </h3>
              
              <p className="text-sm text-gray-500">
                Ingresa tu código postal para verificar cobertura en Guadalajara, Zapopan o Tlajomulco.
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={5}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Ej. 44100"
                  className="px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-berenjena font-mono font-bold focus:outline-none focus:ring-2 focus:ring-terracota w-40"
                />
                <button
                  type="button"
                  onClick={handleCheckZip}
                  disabled={checkingZip}
                  className="bg-sage hover:bg-opacity-90 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-colors"
                >
                  {checkingZip ? "Verificando..." : "Verificar C.P."}
                </button>
              </div>

              {zipError && <p className="text-sm font-bold text-red-500">{zipError}</p>}

              {deliveryZone && (
                <div className="p-4 bg-sage/10 rounded-2xl flex justify-between items-center text-sage">
                  <div>
                    <p className="font-bold text-berenjena">{deliveryZone.municipality}</p>
                    <p className="text-xs text-gray-500">C.P. {deliveryZone.zip_code}</p>
                  </div>
                  <span className="font-bold text-lg text-terracota">+${deliveryZone.delivery_cost.toFixed(2)} MXN</span>
                </div>
              )}
            </div>

            {/* 2. DELIVERY ADDRESS & DATE */}
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white p-8 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-berenjena flex items-center gap-2 pb-3">
                <CalendarBlankIcon size={24} className="text-terracota" />
                2. Datos de Entrega
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Quien recibe o solicita"
                    className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-berenjena focus:outline-none focus:ring-2 focus:ring-terracota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="33 1234 5678"
                    className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-berenjena focus:outline-none focus:ring-2 focus:ring-terracota"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Calle, Número Exterior e Interior</label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Av. Vallarta 1234, Int 5"
                  className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-berenjena focus:outline-none focus:ring-2 focus:ring-terracota"
                />
              </div>

              {/* Fecha y horario de entrega: se calculan a partir de lo elegido en
                  cada producto. Ya no se eligen aquí (era un duplicado). */}
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">
                  Fecha y horario de entrega
                </label>

                {entrega.sinFecha.length > 0 ? (
                  <div className="rounded-xl border-2 border-red-400 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                      <WarningIcon size={18} weight="bold" /> Falta la fecha de entrega
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Estos productos no tienen fecha elegida:{" "}
                      <span className="font-bold">{entrega.sinFecha.join(", ")}</span>.
                      Abre cada uno y elige su fecha para poder continuar.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-lilaPastel bg-cream/30 p-4">
                    <p className="text-base font-bold text-berenjena">
                      🚚 {formatearEntrega(deliveryDate, deliveryTime)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {entrega.detalle.length > 1
                        ? "Es la fecha más lejana de tus productos, para poder entregarlos todos juntos."
                        : "Elegida en la página del producto. Si quieres cambiarla, vuelve a ese producto."}
                    </p>
                  </div>
                )}

                {fechaBloqueada && (
                  <p className="text-xs font-bold text-red-500 mt-2">
                    Esa fecha ya no está disponible para entregas. Vuelve al producto y elige otra.
                  </p>
                )}

                {/* Aviso cuando los productos no coinciden: fecha más lejana */}
                {entrega.requiereAceptacion && (
                  <div className="mt-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
                    <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                      <WarningIcon size={20} weight="bold" /> Tus productos no coinciden en la entrega
                    </p>

                    <ul className="mt-2 space-y-1">
                      {entrega.detalle.map((d, i) => (
                        <li key={i} className="text-xs text-amber-900">
                          • <span className="font-bold">{d.nombre}</span>:{" "}
                          {formatearEntrega(d.fecha, d.hora)}
                          {d.inmediato && (
                            <span className="font-bold"> (entrega inmediata)</span>
                          )}
                        </li>
                      ))}
                    </ul>

                    <p className="text-sm text-amber-900 mt-3">
                      Para entregarlo <span className="font-bold">todo junto</span>, se usará la
                      fecha más lejana:{" "}
                      <span className="font-bold">{formatearEntrega(deliveryDate, deliveryTime)}</span>.
                    </p>

                    {entrega.mezclaInmediata && (
                      <p className="text-xs text-amber-900 mt-2">
                        Ojo: incluye un producto de <span className="font-bold">entrega inmediata</span>,
                        así que con esta fecha dejará de ser inmediato. Si lo necesitas antes, hazlo
                        en un pedido aparte.
                      </p>
                    )}

                    <label className="mt-3 flex items-start gap-3 rounded-lg bg-white border border-amber-300 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aceptaCambio}
                        onChange={(e) => setAceptaCambio(e.target.checked)}
                        className="mt-0.5 w-5 h-5 accent-terracota shrink-0"
                      />
                      <span className="text-sm font-bold text-amber-900">
                        Acepto que mi pedido se entregue el{" "}
                        {formatearEntrega(deliveryDate, deliveryTime)}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">
                  Referencias de la ubicación{" "}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. portón negro, timbre 2, dejar en recepción, preguntar por..."
                  className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-berenjena focus:outline-none focus:ring-2 focus:ring-terracota"
                ></textarea>
              </div>
            </form>

          </div>

          {/* Right Summary Column (1 col) */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white p-8 rounded-3xl shadow-sm sticky top-28 space-y-6">
              <h3 className="text-xl font-bold text-berenjena pb-3">Resumen del Pedido</h3>

              {/* Items List con personalización, fecha y horario */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="text-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-cream" />
                        <div>
                          <p className="font-bold text-berenjena leading-tight">{item.name}</p>
                          <p className="text-xs text-gray-400">Cant: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-terracota shrink-0">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Personalización elegida */}
                    {Object.entries(item.selectedOptions || {})
                      .filter(([, v]) => {
                        if (v === undefined || v === false || v === "") return false;
                        if (Array.isArray(v)) return v.length > 0;
                        return true;
                      })
                      .map(([key, v]) => (
                        <p key={key} className="text-xs text-gray-500 mt-1 ml-[60px]">
                          <span className="font-bold">{key}:</span>{" "}
                          {Array.isArray(v) ? `${v.length} foto(s) adjunta(s)` : v === true ? "Sí" : String(v)}
                        </p>
                      ))}

                    {/* Fecha y horario */}
                    {item.deliveryDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        📅{" "}
                        {new Date(`${item.deliveryDate}T00:00:00`).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {item.deliveryTime ? ` · ${item.deliveryTime}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="pt-4">
                <label className="block text-xs font-bold text-berenjena mb-1 flex items-center gap-1">
                  <TicketIcon size={16} className="text-terracota" /> Cupón de Descuento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="CÓDIGO"
                    className="flex-1 px-3 py-2 border border-lilaPastel rounded-lg bg-cream/30 text-xs font-mono uppercase text-berenjena focus:outline-none"
                  />
                  <button type="submit" className="bg-sage text-white font-bold px-3 py-2 rounded-lg text-xs">
                    Aplicar
                  </button>
                </div>
              </form>

              {/* Price Calculations */}
              <div className="space-y-2 pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)} MXN</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Descuento ({appliedCoupon})</span>
                    <span>-${discountAmount.toFixed(2)} MXN</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Costo de Envío</span>
                  <span>{deliveryZone ? `$${deliveryFee.toFixed(2)} MXN` : "Por calcular"}</span>
                </div>

                <div className="flex justify-between text-lg font-bold text-berenjena pt-2">
                  <span>Total</span>
                  <span className="text-terracota">${totalAmount.toFixed(2)} MXN</span>
                </div>
              </div>

              {!puedePagar && (
                <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg p-3">
                  {!deliveryZone
                    ? "Valida tu código postal para continuar."
                    : entrega.sinFecha.length > 0
                      ? `Falta elegir la fecha de entrega de: ${entrega.sinFecha.join(", ")}`
                      : fechaBloqueada
                        ? "La fecha de entrega no está disponible: vuelve al producto y elige otra."
                        : entrega.requiereAceptacion && !aceptaCambio
                          ? "Marca la casilla para aceptar la fecha de entrega del pedido."
                          : "Revisa los datos del pedido para continuar."}
                </p>
              )}

              <button
                form="checkout-form"
                type="submit"
                disabled={isSubmitting || !puedePagar}
                className="w-full flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
              >
                <CreditCardIcon size={22} weight="bold" />
                {isSubmitting ? "Procesando..." : "Pagar con Mercado Pago"}
              </button>

              <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                Serás redirigido a Mercado Pago para completar tu pago de forma segura (tarjeta, OXXO o SPEI).
              </p>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}