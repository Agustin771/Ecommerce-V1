import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProductCard from "../../components/ProductCard";

const { addToCart } = vi.hoisted(() => ({ addToCart: vi.fn() }));

vi.mock("../../context/CartContext", () => ({
  useCart: () => ({ addToCart }),
}));

const product = {
  id: 7,
  name: "Auriculares Bluetooth",
  description: "Auriculares inalámbricos",
  categoryName: "Audio",
  price: 25000,
  stock: 4,
  images: ["https://example.com/auriculares.jpg"],
};

function renderCard(item = product) {
  return render(
    <MemoryRouter>
      <ProductCard product={item} />
    </MemoryRouter>,
  );
}

describe("ProductCard", () => {
  beforeEach(() => {
    addToCart.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("muestra los datos principales del producto", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: product.name })).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("4 disponibles")).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();
  });

  it("agrega el producto al carrito al presionar el botón", () => {
    renderCard();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Agregar Auriculares Bluetooth al carrito",
      }),
    );

    expect(addToCart).toHaveBeenCalledWith(product);
  });

  it("deshabilita el botón cuando no hay stock", () => {
    renderCard({ ...product, stock: 0 });

    expect(
      screen.getByRole("button", {
        name: "Agregar Auriculares Bluetooth al carrito",
      }),
    ).toBeDisabled();
    expect(screen.getByText("Sin stock")).toBeInTheDocument();
  });
});