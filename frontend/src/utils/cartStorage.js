export const CART_STORAGE_KEY = "ecommerce_cart";

export function clearLocalCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
}