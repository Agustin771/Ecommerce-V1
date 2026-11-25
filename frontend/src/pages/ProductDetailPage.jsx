import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { getProductById } from "../services/productService";
import { useCart } from "../context/CartContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        const data = await getProductById(id);

        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) {
          setError("No encontramos el producto solicitado.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="state-message">Cargando producto...</div>;
  }

  if (error || !product) {
    return (
      <div className="state-message">
        <p>{error || "Producto no encontrado."}</p>
        <Link to="/" className="text-link">Volver al catálogo</Link>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : ["https://placehold.co/600x600?text=Producto"];

  return (
    <main className="detail-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Volver al catálogo
      </Link>

      <div className="detail-layout">
        <div className="detail-gallery">
          <img
            src={images[selectedImage]}
            alt={product.name}
            className="detail-main-image"
          />

          <div className="thumbnail-list">
            {images.map((image, index) => (
              <button
                key={index}
                className={selectedImage === index ? "thumbnail active" : "thumbnail"}
                onClick={() => setSelectedImage(index)}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-info">
          <span className="product-category">
            {product.categoryName}
          </span>

          <h1>{product.name}</h1>
          <p className="detail-description">{product.description}</p>

          <strong className="detail-price">
            {product.price.toLocaleString("es-AR", {
              style: "currency",
              currency: "ARS",
            })}
          </strong>

          <p className="stock-label">
            {product.stock > 0
              ? `${product.stock} unidades disponibles`
              : "Sin stock"}
          </p>

          {product.stock > 0 && (
            <>
              <label className="quantity-label">
                Cantidad
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setQuantity(
                      Math.max(1, Math.min(value, product.stock))
                    );
                  }}
                />
              </label>

              <button
                className="primary-button"
                onClick={() => addToCart(product, quantity)}
              >
                <ShoppingCart size={19} />
                Agregar al carrito
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
