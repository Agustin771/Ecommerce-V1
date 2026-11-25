import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

const fallbackImage =
  "https://placehold.co/600x600/f1f3f5/64748b?text=Producto";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const image = product.images?.[0] || fallbackImage;

  return (
    <article className="product-card">
      <Link
        to={`/producto/${product.id}`}
        className="product-image-container"
      >
        <img
          src={image}
          alt={product.name}
          className="product-image"
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />
      </Link>

      <div className="product-info">
        <span className="product-category">
          {product.categoryName}
        </span>

        <Link to={`/producto/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>

        <p className="product-description">
          {product.description}
        </p>

        <div className="product-bottom">
          <strong>
            {product.price.toLocaleString("es-AR", {
              style: "currency",
              currency: "ARS",
              maximumFractionDigits: 2,
            })}
          </strong>

          <button
            className="add-cart-button"
            disabled={product.stock <= 0}
            onClick={() => addToCart(product)}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingCart size={18} />
          </button>
        </div>

        <span className="stock-label">
          {product.stock > 0
            ? `${product.stock} disponibles`
            : "Sin stock"}
        </span>
      </div>
    </article>
  );
}
