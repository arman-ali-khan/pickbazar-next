import { calculateTotalPrice, type CartItem } from './utils';

describe('calculateTotalPrice', () => {
  it('should calculate the total price for multiple items', () => {
    const items: CartItem[] = [
      { id: 1, name: 'Apple', price: 0.5, quantity: 5 }, // 2.5
      { id: 2, name: 'Banana', price: 0.3, quantity: 10 }, // 3.0
    ];
    expect(calculateTotalPrice(items)).toBe('5.50');
  });

  it('should return "0.00" for an empty cart', () => {
    const items: CartItem[] = [];
    expect(calculateTotalPrice(items)).toBe('0.00');
  });
  
  it('should correctly handle items with a price of zero', () => {
    const items: CartItem[] = [
      { id: 1, name: 'Apple', price: 1.5, quantity: 2 }, // 3.0
      { id: 2, name: 'Freebie', price: 0, quantity: 1 }, // 0.0
    ];
    expect(calculateTotalPrice(items)).toBe('3.00');
  });

  it('should correctly apply a percentage-based discount', () => {
    const items: CartItem[] = [
      { id: 1, name: 'Laptop', price: 1000, quantity: 1 },
      { id: 2, name: 'Mouse', price: 50, quantity: 2 },
    ]; // Subtotal = 1100
    const discountPercentage = 25; // 25% off
    // 1100 * (1 - 0.25) = 825
    expect(calculateTotalPrice(items, discountPercentage)).toBe('825.00');
  });
  
  it('should handle a 100% discount, resulting in a total of "0.00"', () => {
    const items: CartItem[] = [{ id: 1, name: 'Book', price: 20, quantity: 2 }];
    expect(calculateTotalPrice(items, 100)).toBe('0.00');
  });
  
  it('should handle a 0% discount, returning the full subtotal', () => {
    const items: CartItem[] = [{ id: 1, name: 'Book', price: 20, quantity: 2 }];
    expect(calculateTotalPrice(items, 0)).toBe('40.00');
  });

  it('should ensure the output is always formatted to 2 decimal places', () => {
    const items1: CartItem[] = [{ id: 1, name: 'Candy', price: 1, quantity: 1 }];
    expect(calculateTotalPrice(items1)).toBe('1.00');

    const items2: CartItem[] = [{ id: 2, name: 'Gadget', price: 123.456, quantity: 1 }];
    expect(calculateTotalPrice(items2)).toBe('123.46');
  });

  it('should throw an error for an invalid discount percentage', () => {
      const items: CartItem[] = [{ id: 1, name: 'Item', price: 10, quantity: 1 }];
      expect(() => calculateTotalPrice(items, 101)).toThrow("Discount percentage must be between 0 and 100.");
      expect(() => calculateTotalPrice(items, -10)).toThrow("Discount percentage must be between 0 and 100.");
  });

  it('should handle items with invalid price or quantity', () => {
      const items: any[] = [
        { id: 1, name: 'Invalid Price', price: 'invalid', quantity: 1 },
        { id: 2, name: 'Invalid Quantity', price: 10, quantity: null },
        { id: 3, name: 'Valid Item', price: 20, quantity: 1 },
      ];
      expect(calculateTotalPrice(items)).toBe('20.00');
  });
});