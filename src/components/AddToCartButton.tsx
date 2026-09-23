"use client";

import React from "react";
import { useSetAtom } from "jotai";
import { cartItemsAtom, cartOpenAtom, type CartItem } from "@/store/cartStore";
import { complementosModalAbiertoAtom } from "@/store/complementosStore";
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
  selections?: Record<string, string | boolean | string[]>;
  deliveryDate?: string;
  deliveryTime?: string;
  blockedDates?: string[];
  /** Si el producto acepta complementos, al agregar se abre el modal. */
  tieneComplementos?: boolean;
  /** Si viene, se está EDITANDO ese artículo del carrito (se reemplaza). */
  editarId?: string;
  /** Producto de inventario agotado: no se puede comprar. */
  sinStock?: boolean;
}

export default function AddToCartButton({
  product,
  selections,
  deliveryDate,
  deliveryTime,
  blockedDates = [],
  tieneComplementos = false,
  editarId,
  sinStock = false,
}: AddToCartButtonProps) {
  const setCart = useSetAtom(cartItemsAtom);
  const setCartOpen = useSetAtom(cartOpenAtom);
  const setModalComplementos = useSetAtom(complementosModalAbiertoAtom);

  const handleAddToCart = () => {
    // Validar fecha y horario de entrega
    if (!deliveryDate) {
      toast.error("Por favor elige una fecha de entrega");
      return;
    }
    if (blockedDates.includes(deliveryDate)) {
      toast.error("La fecha seleccionada no está disponible. Elige otro día.");
      return;
    }
    if (!deliveryTime) {
      toast.error("Por favor elige un horario de entrega");
      return;
    }

    // Firma única: mismo producto con las mismas opciones y misma fecha/horario = sumar cantidad
    const signature = JSON.stringify({ selections: selections || {}, deliveryDate, deliveryTime });

    // MODO EDICIÓN: se reemplaza el artículo que se estaba editando (misma posición)
    if (editarId) {
      setCart((prev: CartItem[]) =>
        prev.map((item) =>
          item.cartItemId === editarId
            ? {
                ...item,
                productId: product.id,
                name: product.name,
                unitPrice: product.price,
                image: product.image,
                slug: product.slug,
                selectedOptions: selections || {},
                deliveryDate,
                deliveryTime,
              }
            : item
        )
      );
      toast.success("Cambios guardados ✅");
      setCartOpen(true);
      return;
    }

    setCart((prev: CartItem[]) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id &&
          JSON.stringify({
            selections: item.selectedOptions || {},
            deliveryDate: item.deliveryDate,
            deliveryTime: item.deliveryTime,
          }) === signature
      );
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === existing.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

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
          selectedOptions: selections || {},
          deliveryDate,
          deliveryTime,
        },
      ];
    });

    toast.success("Producto agregado al carrito");

    // Si el producto acepta complementos, se ofrece el modal (estilo enviaflores);
    // si no, se abre el carrito como siempre.
    if (tieneComplementos) {
      setModalComplementos(true);
    } else {
      setCartOpen(true);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={sinStock}
      className={`w-full font-bold py-5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 text-lg mb-4 ${
        sinStock
          ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
          : "bg-[#3A243F] hover:bg-opacity-90 text-white hover:shadow-xl"
      }`}
    >
      <ShoppingCartIcon size={24} weight="bold" />
      {sinStock ? "Sin Stock" : editarId ? "Guardar cambios" : "Agregar al Carrito"}
    </button>
  );
}
