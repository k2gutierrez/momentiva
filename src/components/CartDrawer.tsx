"use client";

import React from "react";
import { useAtom } from "jotai";
import { cartItemsAtom, cartOpenAtom } from "@/store/cartStore";
import { XIcon, MinusIcon, PlusIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { toast } from "sonner";

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useAtom(cartOpenAtom);
  const [cartItems, setCartItems] = useAtom(cartItemsAtom);

  // Calcula el subtotal
  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const handleClose = () => setIsOpen(false);

  // Funciones para aumentar/disminuir cantidad
  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartItemId === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // Función para eliminar producto
  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== id));
    toast.success("Producto eliminado del carrito");
  };

  if (!isOpen) return null;

  return (
    // z-[100] es la magia aquí: se pone por encima del Header (z-50)
    <div className="fixed inset-0 z-[100] flex justify-end">
      
      {/* Fondo oscuro desenfocado (Overlay) */}
      <div 
        className="absolute inset-0 bg-[#3A243F]/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Cajón del Carrito */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-fade-in-up">
        
        {/* Cabecera del Cajón */}
        <div className="flex items-center justify-between p-6 border-b border-lilaPastel bg-[#F5EFF6]">
          <h2 className="text-2xl font-bold text-[#3A243F]">Tu Carrito</h2>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 shadow-sm"
          >
            <XIcon size={20} weight="bold" />
          </button>
        </div>

        {/* Cuerpo (Lista de Productos) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-20 flex flex-col items-center">
              <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🛍️</span>
              </div>
              <p className="font-bold text-[#3A243F]">Tu carrito está vacío.</p>
              <p className="text-sm mt-2">¡Agrega algunos globos mágicos!</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 border border-lilaPastel p-4 rounded-2xl bg-white shadow-sm">
                
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-20 h-20 object-cover rounded-xl border border-cream" 
                />
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-[#3A243F] text-sm leading-tight">
                      {item.name}
                    </h3>
                    <button 
                      onClick={() => removeItem(item.cartItemId)} 
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Eliminar"
                    >
                      <XIcon size={16} weight="bold" />
                    </button>
                  </div>
                  
                  <div className="text-terracota font-bold text-sm mt-1">
                    ${item.unitPrice.toFixed(2)} MXN
                  </div>
                  
                  {/* Controles de Cantidad */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-lilaPastel rounded-lg overflow-hidden bg-[#F5EFF6]">
                      <button onClick={() => updateQuantity(item.cartItemId, -1)} className="px-3 py-1.5 hover:bg-lilaPastel/50 transition-colors text-gray-600">
                        <MinusIcon size={12} weight="bold" />
                      </button>
                      <span className="px-3 text-sm font-bold text-[#3A243F]">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, 1)} className="px-3 py-1.5 hover:bg-lilaPastel/50 transition-colors text-gray-600">
                        <PlusIcon size={12} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie del Cajón (Total y Botón de Pago) */}
        {cartItems.length > 0 && (
          <div className="border-t border-lilaPastel p-6 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-gray-600">Subtotal</span>
              <span className="font-bold text-terracota text-2xl leading-none">
                ${subtotal.toFixed(2)} <span className="text-sm font-normal text-gray-500">MXN</span>
              </span>
            </div>
            
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Los costos de envío e impuestos se calculan al ingresar tu código postal en la pantalla de pago.
            </p>
            
            {/* Este botón nos llevará al Checkout que construiremos a continuación */}
            <Link 
              href="/checkout"
              onClick={handleClose}
              className="w-full flex justify-center items-center gap-2 bg-[#C28C77] hover:bg-opacity-90 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all text-lg"
            >
              Proceder al Pago <ArrowRightIcon size={20} weight="bold" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}