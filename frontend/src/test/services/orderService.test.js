import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from "../../services/api";
import { getPendingOrders, retryPayment, cancelOrder } from "../../services/orderService";

describe("orderService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta las compras pendientes del usuario autenticado", async () => {
    const pending = [{ orderNumber: "ORD-001", status: "PENDING" }];
    api.get.mockResolvedValue({ data: pending });

    await expect(getPendingOrders()).resolves.toEqual(pending);
    expect(api.get).toHaveBeenCalledWith("/api/orders/pending");
  });

  it("solicita reintentar el pago de la misma orden", async () => {
    api.post.mockResolvedValue({ data: { checkoutUrl: "https://checkout.test" } });

    await retryPayment("ORD 001");

    expect(api.post).toHaveBeenCalledWith("/api/orders/ORD%20001/retry");
  });

  it("solicita cancelar la orden indicada", async () => {
    api.post.mockResolvedValue({ data: { status: "CANCELLED" } });

    await cancelOrder("ORD-001");

    expect(api.post).toHaveBeenCalledWith("/api/orders/ORD-001/cancel");
  });
});
