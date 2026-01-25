export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Calculates the total price of items in a shopping cart, applies an optional discount,
 * and formats the result.
 *
 * @param items - An array of cart item objects. Each item must have a `price` and `quantity`.
 * @param discountPercentage - An optional discount percentage to apply (e.g., 10 for 10%).
 * @returns The total price as a string formatted to two decimal places.
 */
export function calculateTotalPrice(
  items: CartItem[],
  discountPercentage: number = 0
): string {
  if (!items || items.length === 0) {
    return '0.00';
  }

  const subtotal = items.reduce((total, item) => {
    // Ensure price and quantity are valid numbers, default to 0 if not.
    const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
    const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
    return total + price * quantity;
  }, 0);

  if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100.");
  }

  const discountMultiplier = 1 - discountPercentage / 100;
  const totalPrice = subtotal * discountMultiplier;

  return totalPrice.toFixed(2);
}