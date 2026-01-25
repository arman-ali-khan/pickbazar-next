import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import useProducts from './use-products';
import type { Product } from '@/lib/data';

// Mock product data that matches the Product type structure
const mockProducts: Product[] = [
  { id: 1, name: 'Test Apple', price: 1.99, image: { id: 'p1', imageUrl: '/img.png', imageHint: 'hint', description: 'desc' }, category: 'Fruits', weight: '1 lb', rating: 4.5, originalPrice: 2.50 },
  { id: 2, name: 'Test Banana', price: 0.99, image: { id: 'p2', imageUrl: '/img.png', imageHint: 'hint', description: 'desc' }, category: 'Fruits', weight: '1 lb', rating: 4.0 },
];

// Mock the global fetch function
global.fetch = jest.fn();

describe('useProducts Hook', () => {

  // Reset mocks before each test
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should handle the loading state correctly', () => {
    // Mock a pending promise to keep the hook in a loading state
    (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    const { result } = renderHook(() => useProducts());
    
    // Check initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.products).toBeNull();
  });

  it('should fetch products successfully and update state', async () => {
    // Mock a successful API response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: mockProducts }),
    });

    const { result } = renderHook(() => useProducts());

    // Wait for the hook to finish the async operation
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Assert final state
    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.isError).toBe(false);
    expect(fetch).toHaveBeenCalledWith('/api/products');
  });

  it('should handle an API error (e.g., 500 status) and set error state', async () => {
    // Mock an error response from the API
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useProducts());

    // Wait for the hook to finish
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Assert error state
    expect(result.current.isError).toBe(true);
    expect(result.current.products).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/products');
  });
  
  it('should handle a network error during fetch', async () => {
    // Mock the fetch function to reject the promise
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.products).toBeNull();
  });
});
