import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import ProductCard from './product-details';
import cartReducer, { type CartState } from '@/lib/redux/slices/cartSlice';
import wishlistReducer, { type WishlistState } from '@/lib/redux/slices/wishlistSlice';
import uiReducer, { type UiState } from '@/lib/redux/slices/uiSlice';
import { type Product } from '@/lib/data';

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

// Mock Supabase context, as WishlistButton uses it
jest.mock('@/lib/supabase/provider', () => ({
  useSupabase: () => ({
    supabase: {
      auth: {
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { productIds: [] }, error: null })
          })
        })
      })
    },
    user: { id: 'test-user' },
  }),
}));

// Mock ProductQuickView since it contains a DialogTrigger
jest.mock('./product-quick-view', () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

const mockProduct: Product & { stock: number } = {
  id: 1,
  name: 'Test Apples',
  price: 1.99,
  originalPrice: 2.50,
  image: { id: 'apple-1', imageUrl: '/apple.jpg', imageHint: 'red apple', description: 'an apple' },
  weight: '1lb',
  category: 'Fruits',
  rating: 4.5,
  stock: 10,
};

const mockOutOfStockProduct: Product & { stock: number } = { ...mockProduct, id: 2, stock: 0 };

const mockStore = (cart: Partial<CartState> = {}, wishlist: Partial<WishlistState> = {}) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      wishlist: wishlistReducer,
      ui: uiReducer,
    },
    preloadedState: {
      cart: { items: [], animationState: null, isCartOpen: false, ...cart },
      wishlist: { productIds: [], loading: false, togglingProductId: null, ...wishlist },
      ui: { isSearchOpen: false },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store: EnhancedStore) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('ProductCard', () => {
  it('renders product name and price correctly', () => {
    const store = mockStore();
    renderWithProviders(<ProductCard product={mockProduct} />, store);

    expect(screen.getByText('Test Apples 1lb')).toBeInTheDocument();
    expect(screen.getByText('$1.99')).toBeInTheDocument();
    expect(screen.getByText('$2.50')).toBeInTheDocument(); // Original price
  });

  it('renders image with correct alt text for accessibility', () => {
    const store = mockStore();
    renderWithProviders(<ProductCard product={mockProduct} />, store);

    const image = screen.getByAltText('Test Apples');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining(encodeURIComponent('/apple.jpg')));
  });

  it("calls addToCart when 'Add' button is clicked", () => {
    const store = mockStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    renderWithProviders(<ProductCard product={mockProduct} />, store);
    
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(dispatchSpy).toHaveBeenCalled();
    const dispatchedAction = dispatchSpy.mock.calls.find(call => call[0].type === 'cart/addToCart');
    expect(dispatchedAction).toBeDefined();
    expect(dispatchedAction![0].payload.product).toEqual(mockProduct);
  });

  it("shows 'Out of Stock' badge and disables button when stock is 0", () => {
    const store = mockStore();
    renderWithProviders(<ProductCard product={mockOutOfStockProduct} />, store);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: 'Out of Stock' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});
