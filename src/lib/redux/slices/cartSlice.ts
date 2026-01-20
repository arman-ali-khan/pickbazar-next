import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { Product } from '@/lib/data'
import type { RootState } from '../store';

export interface CartItem extends Product {
  quantity: number;
}

interface AnimationState {
  key: number;
  imageSrc: string;
  imageHint: string;
  startRect: { top: number; left: number; width: number; height: number; };
}

export interface CartState {
  items: CartItem[];
  animationState: AnimationState | null;
  isCartOpen: boolean;
}

const initialState: CartState = {
  items: [],
  animationState: null,
  isCartOpen: false,
}

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
        state.items = action.payload;
    },
    addToCart: (state, action: PayloadAction<{ product: Product, quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ ...product, quantity });
      }
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: number; newQuantity: number }>) => {
      const { productId, newQuantity } = action.payload;
      if (newQuantity <= 0) {
        state.items = state.items.filter(item => item.id !== productId);
      } else {
        const itemToUpdate = state.items.find(item => item.id === productId);
        if (itemToUpdate) {
          itemToUpdate.quantity = newQuantity;
        }
      }
    },
    openCart: (state) => {
      state.isCartOpen = true;
    },
    closeCart: (state) => {
      state.isCartOpen = false;
    },
    triggerFlyToCart: (state, action: PayloadAction<{ imageSrc: string; imageHint: string; startRect: { top: number; left: number; width: number; height: number; } }>) => {
        state.animationState = {
            key: Date.now(),
            ...action.payload
        };
    },
    clearAnimation: (state) => {
        state.animationState = null;
    },
    clearCart: (state) => {
        state.items = [];
    }
  },
})

export const { 
    hydrateCart,
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    openCart, 
    closeCart,
    triggerFlyToCart,
    clearAnimation,
    clearCart
} = cartSlice.actions;

const selectCartItems = (state: RootState) => state.cart.items;

export const selectTotalItems = createSelector(
    selectCartItems,
    (items) => items.reduce((total, item) => total + item.quantity, 0)
);

export const selectSubtotal = createSelector(
    selectCartItems,
    (items) => items.reduce((total, item) => total + item.price * item.quantity, 0)
);

export const selectItemQuantity = (productId: number) => createSelector(
    selectCartItems,
    (items) => items.find(item => item.id === productId)?.quantity ?? 0
);


export default cartSlice.reducer;
