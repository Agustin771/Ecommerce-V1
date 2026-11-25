import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import {
  getCategories,
  getProducts,
} from "../services/productService";

import ProductCard from "../components/ProductCard";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(0);

  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await getCategories();

        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Error cargando categorías:", err);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const result = await getProducts({
          page,
          size: 12,
          name: debouncedSearch,
          categoryId,
        });

        if (!cancelled) {
          setProducts(result.content ?? []);
          setTotalPages(result.totalPages ?? 0);
        }
      } catch (err) {
        console.error("Error cargando productos:", err);

        if (!cancelled) {
          setError(
            "No pudimos cargar los productos. Revisá que el servidor esté funcionando."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, categoryId]);

  function handleSearch(event) {
    setSearch(event.target.value);
    setPage(0);
  }

  function handleCategory(event) {
    setCategoryId(event.target.value);
    setPage(0);
  }

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("");
    setPage(0);
  }

  const selectedCategory = categories.find(
    (category) => String(category.id) === String(categoryId)
  );

  const hasFilters = Boolean(search || categoryId);

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">TU TIENDA ONLINE</span>

          <h1>Encontrá eso que estabas buscando.</h1>

          <p>
            Explorá nuestro catálogo y descubrí productos
            para todos los días.
          </p>

          <a href="#catalogo" className="hero-button">
            Explorar productos
          </a>
        </div>
      </section>

      <section className="catalog-section" id="catalogo">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">NUESTRO CATÁLOGO</span>

            <h2>
              {selectedCategory
                ? selectedCategory.name
                : "Todos los productos"}
            </h2>

            <p>
              {selectedCategory?.description ||
                "Encontrá lo que necesitás en un solo lugar."}
            </p>
          </div>
        </div>

        <div className="catalog-filters">
          <div className="search-box">
            <Search size={19} />

            <input
              type="search"
              placeholder="Buscar productos..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <div className="category-filter">
            <SlidersHorizontal size={18} />

            <select
              value={categoryId}
              onChange={handleCategory}
            >
              <option value="">Todas las categorías</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="clear-filters-button"
              onClick={clearFilters}
            >
              <X size={17} />
              Ver todos los productos
            </button>
          )}
        </div>

        {loading && (
          <div className="state-message">
            Cargando productos...
          </div>
        )}

        {!loading && error && (
          <div className="state-message error-message">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="state-message">
            <p>No encontramos productos con esos filtros.</p>

            {hasFilters && (
              <button
                type="button"
                className="clear-filters-button"
                onClick={clearFilters}
              >
                Ver todos los productos
              </button>
            )}
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={page === 0}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                >
                  Anterior
                </button>

                <span>
                  Página {page + 1} de {totalPages}
                </span>

                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
