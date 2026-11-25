import api from "./api";

export async function getCart() {
  const { data } = await api.get("/api/cart");
  return data;
}

export async function addCartItem(productId, quantity) {
  const { data } = await api.post("/api/cart/items", {
    productId,
    quantity,
  });

  return data;
}

export async function updateCartItem(productId, quantity) {
  const { data } = await api.put(
    `/api/cart/items/${productId}`,
    { quantity }
  );

  return data;
}

export async function removeCartItem(productId) {
  const { data } = await api.delete(
    `/api/cart/items/${productId}`
  );

  return data;
}

export async function clearRemoteCart() {
  await api.delete("/api/cart");
}

export async function createCheckout() {
  const { data } = await api.post("/api/orders/checkout");
  return data;
}
