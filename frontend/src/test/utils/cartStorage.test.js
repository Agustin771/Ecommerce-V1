import { beforeEach, describe, expect, it } from "vitest";
import { CART_STORAGE_KEY, clearLocalCart } from "../../utils/cartStorage";

describe("cartStorage", () => {
  beforeEach(() => localStorage.clear());

  it("elimina el carrito de invitados del almacenamiento local", () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ id: 1 }]));

    clearLocalCart();

    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });
});
