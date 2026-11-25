import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  CheckCircle2,
  Clock3,
  XCircle,
  ShoppingBag,
  LoaderCircle,
} from "lucide-react";

import { getOrderStatus } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function OrderResultPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const returnResult = searchParams.get("resultado");

  const { user, loadingAuth } = useAuth();
  const { refreshCart } = useCart();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  const cartRestoredRef = useRef(false);

  useEffect(() => {
    if (loadingAuth || !user || !orderNumber) return;

    let cancelled = false;
    let timeoutId;
    let attempts = 0;

    async function checkOrder() {
      try {
        const result = await getOrderStatus(orderNumber);

        if (cancelled) return;

        setOrder(result);
        setError("");

        if (result.status === "PAID" || result.status === "CANCELLED") {
          sessionStorage.removeItem("pendingCheckoutOrder");
          setChecking(false);

          if (
            result.status === "CANCELLED" &&
            !cartRestoredRef.current
          ) {
            try {
              await refreshCart();
              cartRestoredRef.current = true;
            } catch (cartError) {
              console.error("No pudimos recuperar el carrito:", cartError);
              setError(
                "La compra se canceló, pero no pudimos actualizar tu carrito. Entrá al carrito para volver a cargarlo.",
              );
            }
          }

          return;
        }
      } catch (requestError) {
        if (cancelled) return;

        console.error("Error consultando la orden:", requestError);
        setError(
          requestError.response?.data?.message ||
            "Tuvimos un problema al consultar el pago. Seguimos intentando automáticamente.",
        );
      }

      const delay = attempts < 12 ? 5000 : 15000;
      attempts += 1;

      if (attempts < 120) {
        setChecking(true);
        timeoutId = window.setTimeout(checkOrder, delay);
      } else {
        setChecking(false);
      }
    }

    setChecking(true);
    checkOrder();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadingAuth, user, orderNumber, refreshCart]);

  const formatPrice = (price) =>
    Number(price).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });

  if (loadingAuth) {
    return (
      <main className="purchase-result-page">
        <section className="purchase-result-card">
          <LoaderCircle className="purchase-result-spinner" size={42} />
          <h1>Estamos verificando tu compra</h1>
          <p>Un momento, estamos consultando la información de tu pedido.</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="purchase-result-page">
        <section className="purchase-result-card">
          <ShoppingBag size={42} />
          <h1>Iniciá sesión para consultar tu compra</h1>
          <p>Necesitamos verificar que esta orden te pertenezca.</p>
          <Link
            className="primary-button"
            to="/login"
            state={{
              from: `/compra/resultado?orderNumber=${encodeURIComponent(
                orderNumber || "",
              )}&resultado=${encodeURIComponent(returnResult || "")}`,
            }}
          >
            Iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  if (!orderNumber) {
    return (
      <main className="purchase-result-page">
        <section className="purchase-result-card">
          <XCircle size={42} />
          <h1>No encontramos el número de compra</h1>
          <p>Volvé a tu cuenta o al catálogo para continuar.</p>
          <Link to="/" className="primary-button">
            Ir al catálogo
          </Link>
        </section>
      </main>
    );
  }

  if (checking && !order) {
    return (
      <main className="purchase-result-page">
        <section className="purchase-result-card">
          <LoaderCircle className="purchase-result-spinner" size={42} />
          <h1>Estamos verificando tu compra</h1>
          <p>Un momento, estamos consultando la información de tu pedido.</p>
          {error && <p className="purchase-result-error-text">{error}</p>}
        </section>
      </main>
    );
  }

  const paid = order?.status === "PAID";
  const cancelled = order?.status === "CANCELLED";
  const pending = order?.status === "PENDING";
  const unresolved = !order;

  return (
    <main className="purchase-result-page">
      <section className="purchase-result-card">
        {paid ? (
          <CheckCircle2 className="purchase-result-success" size={54} />
        ) : cancelled ? (
          <XCircle className="purchase-result-error" size={54} />
        ) : (
          <Clock3 className="purchase-result-pending" size={54} />
        )}

        <span className="section-eyebrow">ESTADO DE TU COMPRA</span>

        <h1>
          {paid
            ? "¡Tu pago fue acreditado!"
            : cancelled
              ? "El pago no se completó"
              : unresolved
                ? "No pudimos consultar tu compra"
                : returnResult === "error"
                  ? "No pudimos confirmar tu pago"
                  : "Estamos esperando la confirmación"}
        </h1>

        <p>
          {paid
            ? "¡Gracias por comprar en nuestra tienda! Te enviamos el detalle de tu compra por correo electrónico."
            : cancelled
              ? "La operación fue cancelada o rechazada. Recuperamos los productos de tu carrito para que puedas intentarlo nuevamente."
              : unresolved
                ? "No logramos obtener el estado de la orden. Antes de iniciar otra compra, revisá tu carrito para comprobar si todavía tenés una reserva pendiente."
                : "Todavía no tenemos una confirmación definitiva. Tu reserva sigue vigente temporalmente mientras verificamos el estado con Mercado Pago. No realices otro pago por esta misma compra."}
        </p>

        {order && (
          <div className="purchase-order-summary">
            <div>
              <span>Número de orden</span>
              <strong>{order.orderNumber}</strong>
            </div>

            <div>
              <span>Estado</span>
              <strong>{order.status}</strong>
            </div>

            <div>
              <span>Total</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>

            {order.items?.map((item, index) => (
              <div className="purchase-order-item" key={`${item.sku}-${index}`}>
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <strong>{formatPrice(item.subtotal)}</strong>
              </div>
            ))}
          </div>
        )}

        {checking && (
          <p className="purchase-checking">
            <LoaderCircle size={16} className="purchase-result-spinner" />
            Seguimos verificando el estado del pago automáticamente...
          </p>
        )}

        {!checking && pending && (
          <p className="purchase-checking">
            La confirmación está demorando más de lo habitual. Podés gestionar
            tu reserva desde el carrito; no necesitás iniciar otra compra.
          </p>
        )}

        {error && <p className="purchase-result-error-text">{error}</p>}

        {pending || unresolved ? (
          <Link to="/carrito" className="primary-button">
            <ShoppingBag size={18} />
            Ir a mi carrito
          </Link>
        ) : cancelled ? (
          <Link to="/carrito" className="primary-button">
            <ShoppingBag size={18} />
            Volver al carrito
          </Link>
        ) : (
          <Link to="/" className="primary-button">
            <ShoppingBag size={18} />
            Volver a la tienda
          </Link>
        )}

        {cancelled && (
          <Link to="/" className="continue-shopping">
            Seguir explorando productos
          </Link>
        )}
      </section>
    </main>
  );
}
