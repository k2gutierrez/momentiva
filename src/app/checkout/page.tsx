"use client";

import React, { useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { cartItemsAtom, cartSubtotalAtom } from "@/store/cartStore";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { processCheckoutOrder, validateCoupon } from "@/actions/checkout";
import { MapPinIcon, CalendarBlankIcon, TicketIcon, CheckCircleIcon, ArrowLeftIcon, CreditCardIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useAtom(cartItemsAtom);
  const subtotal = useAtomValue(cartSubtotalAtom);

  // Delivery Zip Code Matrix state
  const [zipCode, setZipCode] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<any>(null);
  const [checkingZip, setCheckingZip] = useState(false);
  const [zipError, setZipError] = useState("");

  // Dates
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Address fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
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
      .eq("is_active", true)
      .single();

    if (error || !data) {
      setZipError("Lo sentimos, aún no tenemos cobertura de entrega en este código postal.");
    } else {
      setDeliveryZone(data);
      toast.success(`Cobertura confirmada: ${data.zone_name} ($${data.price} MXN)`);
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

    if (!deliveryDate) {
      toast.error("Por favor selecciona una fecha de entrega.");
      return;
    }

    if (blockedDates.includes(deliveryDate)) {
      toast.error("La fecha seleccionada no está disponible para entregas.");
      return;
    }

    setIsSubmitting(true);

    const deliveryFee = deliveryZone.price || 0;
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
        zoneName: deliveryZone.zone_name,
      },
      deliveryDate,
      couponCode: appliedCoupon || undefined,
      discountAmount,
      deliveryFee,
      subtotal,
      totalAmount,
      totalCost,
      cartItems: cart,
    });

    if (result.success) {
      setCart([]); // Clear Jotai cart
      setOrderComplete(true);
      toast.success("¡Pedido realizado con éxito!");
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

  const deliveryFee = deliveryZone ? deliveryZone.price : 0;
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
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-lilaPastel space-y-4">
              <h3 className="text-xl font-bold text-berenjena flex items-center gap-2 border-b border-lilaPastel pb-3">
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
                <div className="p-4 bg-sage/10 border border-sage/30 rounded-2xl flex justify-between items-center text-sage">
                  <div>
                    <p className="font-bold text-berenjena">{deliveryZone.zone_name}</p>
                    <p className="text-xs text-gray-500">{deliveryZone.municipality}</p>
                  </div>
                  <span className="font-bold text-lg text-terracota">+${deliveryZone.price.toFixed(2)} MXN</span>
                </div>
              )}
            </div>

            {/* 2. DELIVERY ADDRESS & DATE */}
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white p-8 rounded-3xl shadow-sm border border-lilaPastel space-y-6">
              <h3 className="text-xl font-bold text-berenjena flex items-center gap-2 border-b border-lilaPastel pb-3">
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

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Fecha de Entrega Deseada</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-berenjena focus:outline-none focus:ring-2 focus:ring-terracota"
                />
                {blockedDates.includes(deliveryDate) && (
                  <p className="text-xs font-bold text-red-500 mt-1">
                    Esta fecha no está disponible para entregas. Por favor elige otro día.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Notas Especiales / Dedicatoria</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mensaje para la tarjeta de regalo o instrucciones de entrega..."
                  className="w-full px-4 py-3 border border-lilaPastel rounded-xl bg-cream/30 text-berenjena focus:outline-none focus:ring-2 focus:ring-terracota"
                ></textarea>
              </div>
            </form>

          </div>

          {/* Right Summary Column (1 col) */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-lilaPastel sticky top-28 space-y-6">
              <h3 className="text-xl font-bold text-berenjena border-b border-lilaPastel pb-3">Resumen del Pedido</h3>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-berenjena">{item.name}</p>
                      <p className="text-xs text-gray-400">Cant: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-terracota">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="pt-4 border-t border-lilaPastel">
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
              <div className="space-y-2 pt-4 border-t border-lilaPastel text-sm">
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

                <div className="flex justify-between text-lg font-bold text-berenjena pt-2 border-t border-lilaPastel">
                  <span>Total</span>
                  <span className="text-terracota">${totalAmount.toFixed(2)} MXN</span>
                </div>
              </div>

              <button
                form="checkout-form"
                type="submit"
                disabled={isSubmitting || !deliveryZone}
                className="w-full flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
              >
                <CreditCardIcon size={22} weight="bold" />
                {isSubmitting ? "Procesando..." : "Confirmar y Pagar"}
              </button>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}