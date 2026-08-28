"use client";

import React from "react";
import { useSetAtom } from "jotai";
import { cartItemsAtom, cartOpenAtom } from "@/store/cartStore";
import { ShoppingCartIcon } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    slug: string;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const setCart = useSetAtom(cartItemsAtom);
  const setCartOpen = useSetAtom(cartOpenAtom);

  const handleAddToCart = () => {
    setCart((prev: any) => {
      // Verificamos si ya existe el producto normal para sumarle 1 a la cantidad
      const existing = prev.find((item: any) => item.productId === product.id);
      if (existing) {
        return prev.map((item: any) =>
          item.cartItemId === existing.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // Si es nuevo, lo metemos al arreglo
      return [
        ...prev,
        {
          cartItemId: `${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          image: product.image,
          slug: product.slug,
        },
      ];
    });

    toast.success("Producto agregado al carrito");
    setCartOpen(true);
  };

  return (
    <button 
      onClick={handleAddToCart}
      className="w-full bg-[#3A243F] hover:bg-opacity-90 text-white font-bold py-5 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg mb-4"
    >
      <ShoppingCartIcon size={24} weight="bold" />
      Agregar al Carrito
    </button>
  );
}