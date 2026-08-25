import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface CartItem {
  cartItemId: string; // Unique string identifying product + chosen options
  productId: string;
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedOptions?: Record<string, any>;
  customCupImage?: string | null;
}

// Controls whether the slide-over drawer is open
export const cartOpenAtom = atom<boolean>(false);

// Persistent Cart items array saved in browser localStorage
export const cartItemsAtom = atomWithStorage<CartItem[]>("momentiva_cart", []);

// Derived atom to calculate total item count for the navbar badge
export const cartTotalCountAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.quantity, 0);
});

// Derived atom to calculate cart subtotal price
export const cartSubtotalAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
});