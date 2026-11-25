import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "./AuthContext";

import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearRemoteCart,
} from "../services/cartService";

import { CART_STORAGE_KEY } from "../utils/cartStorage";

const CartContext = createContext(null);

function loadGuestCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item?.id && Number(item.stock) > 0)
      .map((item) => ({
        ...item,
        id: Number(item.id),
        price: Number(item.price),
        stock: Number(item.stock),
        quantity: Math.max(
          1,
          Math.min(Math.floor(Number(item.quantity) || 1), Number(item.stock)),
        ),
      }));
  } catch (error) {
    console.error("Error recuperando el carrito local:", error);
    return [];
  }
}

function mapCartResponse(response) {
  return (response?.items ?? []).map((item) => ({
    id: item.productId,
    name: item.name,
    sku: item.sku,
    price: Number(item.price),
    stock: Number(item.stock),
    quantity: Number(item.quantity),
    images: item.images ?? [],
  }));
}

export function CartProvider({ children }) {
  const { user, loadingAuth } = useAuth();

  const [items, setItems] = useState([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartError, setCartError] = useState("");

  const previousUserIdRef = useRef(null);
  const syncPromiseRef = useRef(null);
  const skipGuestSaveRef = useRef(false);

  const userId = user?.id ?? null;
  const isAuthenticated = Boolean(userId);

  useEffect(() => {
    if (loadingAuth) return;

    let cancelled = false;

    async function initializeGuestCart() {
      const previousUserId = previousUserIdRef.current;

      if (previousUserId !== null) {
        skipGuestSaveRef.current = true;

        localStorage.removeItem(CART_STORAGE_KEY);
        setItems([]);
      } else {
        setItems(loadGuestCart());
      }

      previousUserIdRef.current = null;
      setCartReady(true);
    }

    async function initializeUserCart() {
      previousUserIdRef.current = userId;

      if (syncPromiseRef.current?.userId === userId) {
        try {
          const response = await syncPromiseRef.current.promise;

          if (!cancelled) {
            setItems(mapCartResponse(response));
            setCartError("");
            setCartReady(true);
          }
        } catch (error) {
          if (!cancelled) {
            setCartError(
              error.response?.data?.message ||
                "No pudimos recuperar tu carrito.",
            );
            setCartReady(true);
          }
        }

        return;
      }

      const guestItems = loadGuestCart();

      const promise = (async () => {
        let response = await getCart();

        for (const guestItem of guestItems) {
          try {
            response = await addCartItem(guestItem.id, guestItem.quantity);
          } catch (error) {
            console.warn(
              `No se pudo fusionar el producto ${guestItem.id}:`,
              error.response?.data?.message || error.message,
            );
          }
        }

        localStorage.removeItem(CART_STORAGE_KEY);

        return response;
      })();

      syncPromiseRef.current = {
        userId,
        promise,
      };

      try {
        const response = await promise;

        if (!cancelled) {
          setItems(mapCartResponse(response));
          setCartError("");
          setCartReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setCartError(
            error.response?.data?.message || "No pudimos recuperar tu carrito.",
          );
          setCartReady(true);
        }
      } finally {
        if (syncPromiseRef.current?.promise === promise) {
          syncPromiseRef.current = null;
        }
      }
    }

    if (isAuthenticated) {
      initializeUserCart();
    } else {
      initializeGuestCart();
    }

    return () => {
      cancelled = true;
    };
  }, [loadingAuth, userId, isAuthenticated]);

  useEffect(() => {
    if (!cartReady || isAuthenticated) return;

    if (skipGuestSaveRef.current) {
      skipGuestSaveRef.current = false;
      return;
    }

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("No pudimos guardar el carrito:", error);
    }
  }, [items, cartReady, isAuthenticated]);

  async function addToCart(product, quantity = 1) {
    const requestedQuantity = Math.floor(Number(quantity));

    if (
      !product?.id ||
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity < 1 ||
      Number(product.stock) < 1
    ) {
      return;
    }

    setCartError("");

    if (isAuthenticated) {
      try {
        const response = await addCartItem(product.id, requestedQuantity);

        setItems(mapCartResponse(response));
      } catch (error) {
        setCartError(
          error.response?.data?.message ||
            "No pudimos agregar el producto al carrito.",
        );
      }

      return;
    }

    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);

      const stock = Number(product.stock);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...product,
                quantity: Math.min(item.quantity + requestedQuantity, stock),
              }
            : item,
        );
      }

      return [
        ...current,
        {
          ...product,
          price: Number(product.price),
          stock,
          quantity: Math.min(requestedQuantity, stock),
        },
      ];
    });
  }

  async function updateQuantity(productId, quantity) {
    const requestedQuantity = Math.floor(Number(quantity));

    if (!Number.isFinite(requestedQuantity)) return;

    setCartError("");

    if (isAuthenticated) {
      try {
        const response = await updateCartItem(productId, requestedQuantity);

        setItems(mapCartResponse(response));
      } catch (error) {
        setCartError(
          error.response?.data?.message || "No pudimos actualizar la cantidad.",
        );
      }

      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.id !== productId) return item;

        return {
          ...item,
          quantity: Math.max(1, Math.min(requestedQuantity, item.stock)),
        };
      }),
    );
  }

  async function removeFromCart(productId) {
    setCartError("");

    if (isAuthenticated) {
      try {
        const response = await removeCartItem(productId);
        setItems(mapCartResponse(response));
      } catch (error) {
        setCartError(
          error.response?.data?.message ||
            "No pudimos quitar el producto del carrito.",
        );
      }

      return;
    }

    setItems((current) => current.filter((item) => item.id !== productId));
  }

  async function clearCart() {
    setCartError("");

    if (isAuthenticated) {
      try {
        await clearRemoteCart();
      } catch (error) {
        setCartError(
          error.response?.data?.message || "No pudimos vaciar el carrito.",
        );
        return;
      }
    }

    setItems([]);
  }

  function resetCartAfterCheckout() {
    setItems([]);
    setCartError("");
  }

  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      const response = await getCart();

      setItems(mapCartResponse(response));
      setCartError("");

      return response;
    }

    const guestItems = loadGuestCart();
    setItems(guestItems);

    return guestItems;
  }, [isAuthenticated]);

  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );

  const value = {
    items,
    total,
    totalItems,
    cartReady,
    cartError,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    resetCartAfterCheckout,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe utilizarse dentro de CartProvider");
  }

  return context;
}
