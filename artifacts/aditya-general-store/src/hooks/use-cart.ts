import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  unit: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item: CartItem) => set((state: CartStore) => {
        const existing = state.items.find((i: CartItem) => i.productId === item.productId);
        if (existing) {
          return {
            items: state.items.map((i: CartItem) =>
              i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (productId: number) => set((state: CartStore) => ({
        items: state.items.filter((i: CartItem) => i.productId !== productId),
      })),
      updateQuantity: (productId: number, quantity: number) => set((state: CartStore) => {
        if (quantity <= 0) {
          return { items: state.items.filter((i: CartItem) => i.productId !== productId) };
        }
        return {
          items: state.items.map((i: CartItem) => i.productId === productId ? { ...i, quantity } : i),
        };
      }),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'aditya-cart-storage',
    }
  )
);