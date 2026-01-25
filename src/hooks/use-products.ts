import { useState, useEffect } from 'react';
import type { Product } from '@/lib/data';

interface UseProductsReturn {
  products: Product[] | null;
  isLoading: boolean;
  isError: boolean;
}

/**
 * A custom hook to fetch products from an API.
 * Note: This hook assumes an API endpoint exists at `/api/products`.
 */
export default function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        // Assuming the API returns an object like { products: [...] }
        const data = await response.json();
        setProducts(data.products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts(null);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, isLoading, isError };
}
