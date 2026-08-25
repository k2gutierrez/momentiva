"use client";

import React from "react";
import { useAtom, useAtomValue } from "jotai";
import { cartOpenAtom, cartItemsAtom, cartSubtotalAtom } from "@/store/cartStore";
import { XIcon, TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useAtom(cartOpenAtom);
  const [cart, setCart] = useAtom(cartItemsAtom);
  const subtotal = useAtomValue(cartSubtotalAtom);

  if (!isOpen) return null;

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof prevCart
    );
  };

  const removeItem = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== cartItemId));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsOpen(false)} 
        className="absolute inset-0 bg-berenjena/40 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-lilaPastel flex flex-col justify-between animate-slide-left">
          
          {/* Header */}
          <div className="p-6 bg-cream/50 border-b border-lilaPastel flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sage/20 text-sage rounded-xl">
                <ShoppingBagIcon size={24} weight="bold" />
              </div>
              <h3 className="text-xl font-bold text-berenjena">Tu Carrito</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-berenjena hover:bg-cream rounded-full transition-colors"
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-20 text-gray-400 space-y-4">
                <ShoppingBagIcon size={56} className="mx-auto text-lilaPastel" weight="light" />
                <p className="text-berenjena font-semibold">Tu carrito está vacío.</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-bold text-terracota hover:underline inline-block"
                >
                  Explorar productos
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.cartItemId} 
                  className="flex gap-4 p-4 rounded-2xl border border-lilaPastel bg-white shadow-sm relative group"
                >
                  {/* Thumbnail / Custom Cup Image */}
                  <div className="w-20 h-20 bg-cream rounded-xl overflow-hidden border border-lilaPastel flex-shrink-0">
                    <img 
                      src={item.customCupImage || item.image || "/placeholder.jpg"} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-berenjena text-sm leading-tight pr-4">
                          {item.name}
                        </h4>
                        <button 
                          onClick={() => removeItem(item.cartItemId)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1"
                          title="Eliminar"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>

                      {/* Display custom selected options */}
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div className="text-xs text-sage mt-1 space-y-0.5">
                          {Object.entries(item.selectedOptions).map(([key, value]) => (
                            <p key={key}>
                              • {key}: <span className="font-semibold text-berenjena">{String(value)}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className="font-bold text-terracota text-sm">
                        ${(item.unitPrice * item.quantity).toFixed(2)} MXN
                      </span>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 border border-lilaPastel bg-cream/40 rounded-lg px-2 py-1">
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, -1)}
                          className="p-1 text-gray-500 hover:text-berenjena"
                        >
                          <MinusIcon size={12} weight="bold" />
                        </button>
                        <span className="text-xs font-bold text-berenjena min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, 1)}
                          className="p-1 text-gray-500 hover:text-berenjena"
                        >
                          <PlusIcon size={12} weight="bold" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-6 bg-cream/30 border-t border-lilaPastel space-y-4">
              <div className="flex justify-between items-center text-berenjena">
                <span className="font-semibold text-sm">Subtotal</span>
                <span className="font-bold text-xl text-terracota">${subtotal.toFixed(2)} MXN</span>
              </div>
              <p className="text-xs text-gray-400">
                Los costos de envío e impuestos se calculan al ingresar tu código postal en la pantalla de pago.
              </p>

              <Link
                href="/checkout"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-terracota hover:bg-opacity-90 text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
              >
                <span>Proceder al Pago</span>
                <ArrowRightIcon size={18} weight="bold" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}