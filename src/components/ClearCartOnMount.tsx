"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { cartItemsAtom } from "@/store/cartStore";

// Limpia el carrito al montar (se usa en las páginas de resultado del pago)
export default function ClearCartOnMount() {
  const setCart = useSetAtom(cartItemsAtom);

  useEffect(() => {
    setCart([]);
  }, [setCart]);

  return null;
}
