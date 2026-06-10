import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../types/database';

export interface WishlistItem {
  productId: string;
  product: Product;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          if (state.items.some((i) => i.productId === product.id)) {
            return state;
          }
          return { items: [...state.items, { productId: product.id, product }] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
      },
      isInWishlist: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'kenkicks-wishlist',
    }
  )
);
