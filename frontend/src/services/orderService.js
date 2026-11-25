import api from "./api";

export async function createCheckout(orderData) {
  const { data } = await api.post(
    "/api/orders/checkout",
    orderData
  );

  return data;
}

export async function getPendingOrders() {
  const { data } = await api.get("/api/orders/pending");
  return data;
}

export async function getOrderStatus(orderNumber) {
  const { data } = await api.get(
    `/api/orders/${encodeURIComponent(orderNumber)}`
  );

  return data;
}

export async function cancelOrder(orderNumber) {
  const { data } = await api.post(
    `/api/orders/${encodeURIComponent(orderNumber)}/cancel`
  );

  return data;
}
export async function retryPayment(orderNumber) {
  const { data } = await api.post(
    `/api/orders/${encodeURIComponent(orderNumber)}/retry`
  );

  return data;
}
