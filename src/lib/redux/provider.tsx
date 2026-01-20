'use client';

import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { hydrateCart, type CartItem } from './slices/cartSlice';

const StoreSync = () => {
    const isInitialRender = useRef(true);

    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const parsedCart: CartItem[] = JSON.parse(savedCart);
                store.dispatch(hydrateCart(parsedCart));
            }
        } catch (error) {
            console.error('Failed to parse cart from localStorage', error);
        }
        isInitialRender.current = false;

        const unsubscribe = store.subscribe(() => {
            if (!isInitialRender.current) {
                const state = store.getState();
                localStorage.setItem('cart', JSON.stringify(state.cart.items));
            }
        });

        return unsubscribe;
    }, []);

    return null;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StoreSync />
      {children}
    </Provider>
  );
}
