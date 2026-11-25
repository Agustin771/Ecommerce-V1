import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ShoppingCart,
  X,
  LoaderCircle,
  CreditCard,
} from "lucide-react";
import { createCheckout, getPendingOrders, cancelOrder, retryPayment } from "../services/orderService";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function CartPage() {
  const {
    items,
    total,
    totalItems,
    cartReady,
    cartError,
    removeFromCart,
    updateQuantity,
    clearCart,
    resetCartAfterCheckout,
    refreshCart,
  } = useCart();

  const { user, loadingAuth } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [pendingCheckouts, setPendingCheckouts] = useState([]);
  const [pendingCheckoutLoading, setPendingCheckoutLoading] = useState(false);
  const [pendingRetryLoading, setPendingRetryLoading] = useState(false);
  const [pendingCheckoutError, setPendingCheckoutError] = useState("");

  const formatPrice = (price) =>
    Number(price).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });

  async function handleCheckout() {
    if (loadingAuth || checkoutLoading) return;

    if (!user) {
      navigate("/login", {
        state: { from: "/carrito" },
      });
      return;
    }

    if (items.length === 0) return;

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const order = await createCheckout();

      if (!order?.checkoutUrl) {
        throw new Error("No recibimos el enlace de pago de Mercado Pago.");
      }

      sessionStorage.setItem("pendingCheckoutOrder", order.orderNumber);

      resetCartAfterCheckout();

      window.location.assign(order.checkoutUrl);
    } catch (error) {
      console.error("Error iniciando el checkout:", error);

      setCheckoutError(
        error.response?.data?.message ||
          error.message ||
          "No pudimos iniciar tu compra. Intentá nuevamente.",
      );

      setCheckoutLoading(false);
    }
  }

  useEffect(() => {
    if (loadingAuth || !user) {
      setPendingCheckouts([]);
      setPendingCheckoutError("");
      setPendingCheckoutLoading(false);
      return;
    }

    let active = true;

    async function loadPendingCheckouts() {
      setPendingCheckoutLoading(true);

      try {
        // La base de datos es la fuente de verdad: funciona aunque se cierre el navegador.
        const result = await getPendingOrders();

        if (!active) return;

        const pending = Array.isArray(result) ? result : [];
        setPendingCheckouts(pending);

        if (pending.length === 0) {
          sessionStorage.removeItem("pendingCheckoutOrder");
        } else {
          // Se conserva por compatibilidad con la versión anterior; ya no es necesaria
          // para recuperar la compra después de cerrar el navegador.
          sessionStorage.setItem("pendingCheckoutOrder", pending[0].orderNumber);
        }
      } catch (error) {
        console.error("No pudimos recuperar tus compras pendientes:", error);
        if (active) {
          setPendingCheckoutError(
            "No pudimos consultar tus compras pendientes. Actualizá la página para volver a intentar."
          );
        }
      } finally {
        if (active) setPendingCheckoutLoading(false);
      }
    }

    loadPendingCheckouts();

    return () => {
      active = false;
    };
  }, [loadingAuth, user]);

  async function handleRetryPendingCheckout(order) {
    if (!order || pendingRetryLoading) return;

    setPendingRetryLoading(true);
    setPendingCheckoutError("");

    try {
      const result = await retryPayment(order.orderNumber);

      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      if (result.status === "CANCELLED") {
        await refreshPendingCheckouts();
        await refreshCart();
        setCheckoutError(
          "El intento de pago venció o fue cancelado. Recuperamos los productos en tu carrito para que puedas iniciar una nueva compra."
        );
      } else if (result.status === "PAID") {
        await refreshPendingCheckouts();
        setCheckoutError("Esta compra ya fue acreditada. No necesitás volver a pagar.");
      } else {
        setPendingCheckoutError(
          "Mercado Pago todavía está procesando esta compra. Esperá unos instantes y volvé a intentar."
        );
      }
    } catch (error) {
      setPendingCheckoutError(
        error.response?.data?.message ||
          "No pudimos recuperar el enlace de pago. Intentá nuevamente en unos instantes."
      );
    } finally {
      setPendingRetryLoading(false);
    }
  }

  async function refreshPendingCheckouts() {
    const result = await getPendingOrders();
    const pending = Array.isArray(result) ? result : [];
    setPendingCheckouts(pending);

    if (pending.length === 0) {
      sessionStorage.removeItem("pendingCheckoutOrder");
    } else {
      sessionStorage.setItem("pendingCheckoutOrder", pending[0].orderNumber);
    }
  }

  async function handleCancelPendingCheckout(order) {
    if (!order || pendingCheckoutLoading) return;

    const confirmed = window.confirm(
      "¿Querés cancelar esta reserva? Si Mercado Pago confirma la cancelación, los productos volverán a tu carrito.",
    );

    if (!confirmed) return;

    setPendingCheckoutLoading(true);
    setPendingCheckoutError("");

    try {
      const result = await cancelOrder(order.orderNumber);

      if (result.status === "CANCELLED") {
        await refreshPendingCheckouts();
        await refreshCart();
      } else if (result.status === "PAID") {
        await refreshPendingCheckouts();
        setCheckoutError(
          "La compra ya fue acreditada. No es posible cancelarla.",
        );
      } else {
        setPendingCheckoutError(
          "La operación sigue pendiente en Mercado Pago. No liberamos el stock porque todavía no se confirmó la cancelación.",
        );
      }
    } catch (error) {
      setPendingCheckoutError(
        error.response?.data?.message ||
          "No pudimos cancelar la reserva. Intentá nuevamente.",
      );
    } finally {
      setPendingCheckoutLoading(false);
    }
  }

  const pendingCheckoutBanners = pendingCheckouts.map((order) => (
    <section className="cart-pending-checkout" aria-labelledby={`pending-checkout-${order.orderNumber}`} key={order.orderNumber}>
      <div className="cart-pending-icon" aria-hidden="true">
        <LoaderCircle size={23} />
      </div>

      <div className="cart-pending-content">
        <div className="cart-pending-heading">
          <span className="cart-pending-eyebrow">RESERVA TEMPORAL</span>
          <h2 id={`pending-checkout-${order.orderNumber}`}>Tenés una compra pendiente</h2>
        </div>

        <p>
          Tu compra todavía no fue confirmada. Los productos están reservados
          temporalmente. Si decidiste no continuar, podés cancelar el intento y
          recuperarlos en tu carrito.
        </p>

        <div className="cart-pending-order">
          <span>Número de orden</span>
          <strong>{order.orderNumber}</strong>
        </div>

      </div>

      <div className="cart-pending-actions">
        <button
          type="button"
          className="primary-button cart-pending-retry-button"
          onClick={() => handleRetryPendingCheckout(order)}
          disabled={pendingRetryLoading || pendingCheckoutLoading}
        >
          {pendingRetryLoading ? (
            <>
              <LoaderCircle size={16} className="checkout-spinner" />
              Verificando pago...
            </>
          ) : (
            <>
              <CreditCard size={16} />
              Continuar con el pago
            </>
          )}
        </button>
        <button
          type="button"
          className="cart-pending-cancel-button"
          onClick={() => handleCancelPendingCheckout(order)}
          disabled={pendingCheckoutLoading || pendingRetryLoading}
        >
          {pendingCheckoutLoading ? (
            <>
              <LoaderCircle size={16} className="checkout-spinner" />
              Verificando...
            </>
          ) : (
            "Cancelar reserva"
          )}
        </button>
        <small>Podés continuar el pago o cancelar la reserva. El stock solo se libera cuando Mercado Pago confirma la cancelación.</small>
      </div>
    </section>
  ));

  const pendingCheckoutErrorBanner = pendingCheckoutError && (
    <div className="admin-alert error" role="alert">{pendingCheckoutError}</div>
  );

  if (!cartReady || loadingAuth) {
    return (
      <main className="cart-page">
        {pendingCheckoutBanners}
        {pendingCheckoutErrorBanner}
        <div className="state-message">Recuperando tu carrito...</div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="cart-page cart-empty">
        {pendingCheckoutBanners}
        {pendingCheckoutErrorBanner}
        <div className="cart-empty-icon">
          <ShoppingBag size={42} />
        </div>

        <h1>Tu carrito está vacío</h1>

        <p>
          ¡Todavía no agregaste ningún producto! Explorá nuestro catálogo y
          encontrá algo que te guste.
        </p>

        <Link to="/" className="primary-button">
          <ArrowLeft size={18} />
          Ir al catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="cart-page">
      {pendingCheckoutBanners}
      {pendingCheckoutErrorBanner}

      {(cartError || checkoutError) && (
        <div className="admin-alert error">{checkoutError || cartError}</div>
      )}

      <div className="cart-page-heading">
        <div>
          <span className="section-eyebrow">TU COMPRA</span>
          <h1>Mi carrito</h1>
          <p>
            Tenés {totalItems} {totalItems === 1 ? "producto" : "productos"} en
            tu carrito.
          </p>
        </div>

        <button
          type="button"
          className="cart-clear-button"
          disabled={checkoutLoading}
          onClick={() => {
            if (window.confirm("¿Querés vaciar todo el carrito?")) {
              clearCart();
            }
          }}
        >
          <Trash2 size={17} />
          Vaciar carrito
        </button>
      </div>

      <div className="cart-layout">
        <section className="cart-items">
          {items.map((item) => (
            <article className="cart-item" key={item.id}>
              <Link to={`/producto/${item.id}`} className="cart-item-image">
                <img
                  src={
                    item.images?.[0] ||
                    "https://placehold.co/120x120?text=Producto"
                  }
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.src =
                      "https://placehold.co/120x120?text=Producto";
                  }}
                />
              </Link>

              <div className="cart-item-info">
                <Link to={`/producto/${item.id}`}>
                  <h3>{item.name}</h3>
                </Link>

                <p className="cart-unit-price">
                  {formatPrice(item.price)} por unidad
                </p>

                <div className="quantity-controls">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={checkoutLoading || item.quantity <= 1}
                    aria-label="Reducir cantidad"
                  >
                    <Minus size={15} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={checkoutLoading || item.quantity >= item.stock}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {item.quantity >= item.stock && (
                  <small className="cart-stock-warning">
                    Alcanzaste el stock disponible
                  </small>
                )}
              </div>

              <div className="cart-item-actions">
                <strong>{formatPrice(item.price * item.quantity)}</strong>

                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeFromCart(item.id)}
                  disabled={checkoutLoading}
                  aria-label={`Eliminar ${item.name} del carrito`}
                  title="Eliminar producto"
                >
                  <X size={19} />
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="cart-summary">
          <h2>Resumen del pedido</h2>

          <div className="summary-row">
            <span>Unidades</span>
            <strong>{totalItems}</strong>
          </div>

          <div className="summary-row">
            <span>Productos diferentes</span>
            <strong>{items.length}</strong>
          </div>

          <div className="summary-row summary-total">
            <span>Total estimado</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <p className="cart-summary-note">
            El precio y la disponibilidad se verificarán nuevamente al confirmar
            tu compra.
          </p>

          <button
            type="button"
            className="primary-button checkout-button"
            onClick={handleCheckout}
            disabled={checkoutLoading || pendingCheckoutLoading || Boolean(pendingCheckoutError) || items.length === 0 || pendingCheckouts.length > 0}
          >
            {checkoutLoading ? (
              <>
                <LoaderCircle size={18} className="checkout-spinner" />
                Preparando tu compra...
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                {pendingCheckouts.length > 0 ? "Resolvé las compras pendientes" : "Finalizar compra"}
              </>
            )}
          </button>

          <Link to="/" className="continue-shopping">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </main>
  );
}
