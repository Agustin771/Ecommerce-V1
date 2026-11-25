import { useCallback, useEffect, useState } from "react";
import {
  Package,
  Tags,
  Plus,
  Pencil,
  Power,
  RefreshCw,
  X,
  Save,
  ImagePlus,
  Trash2,
} from "lucide-react";

import {
  getAdminProducts,
  createProduct,
  updateProduct,
  activateProduct,
  deactivateProduct,
  deleteProduct,
  getAdminCategories,
  createCategory,
  updateCategory,
  activateCategory,
  deactivateCategory,
} from "../services/adminService";

const emptyProduct = {
  sku: "",
  name: "",
  description: "",
  price: "",
  stock: "",
  images: ["", "", ""],
  categoryId: "",
};

const emptyCategory = {
  name: "",
  description: "",
};

export default function AdminDashboard() {
  const [section, setSection] = useState("products");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [productForm, setProductForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productsData, categoriesData] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No pudimos cargar los datos de administración."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeleteProduct(product) {
  const confirmed = window.confirm(
    `¿Estás seguro de eliminar definitivamente "${product.name}"?`
  );

  if (!confirmed) return;

  setError("");
  setSuccess("");

  try {
    await deleteProduct(product.id);

    showSuccess("Producto eliminado correctamente.");

    await loadData();
  } catch (err) {
    console.error("Error eliminando producto:", err);

    setError(
      err.response?.data?.message ||
      "No pudimos eliminar el producto."
    );
  }
  }

  function showSuccess(message) {
    setSuccess(message);
    setError("");
  }

  function closeProductForm() {
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm(emptyProduct);
  }

  function closeCategoryForm() {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryForm(emptyCategory);
  }

  function startNewProduct() {
    setProductForm({
      ...emptyProduct,
      categoryId: "",
    });

    setEditingProduct(null);
    setShowProductForm(true);
    setError("");
    setSuccess("");
  }

  function startEditProduct(product) {
    setProductForm({
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      images: [...product.images],
      categoryId: String(product.categoryId),
    });

    setEditingProduct(product.id);
    setShowProductForm(true);
    setError("");
    setSuccess("");
  }

  function startNewCategory() {
    setCategoryForm(emptyCategory);
    setEditingCategory(null);
    setShowCategoryForm(true);
    setError("");
    setSuccess("");
  }

  function startEditCategory(category) {
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });

    setEditingCategory(category.id);
    setShowCategoryForm(true);
    setError("");
    setSuccess("");
  }

  function updateImage(index, value) {
    setProductForm((current) => {
      const images = [...current.images];
      images[index] = value;

      return {
        ...current,
        images,
      };
    });
  }

  function addImageField() {
    setProductForm((current) => ({
      ...current,
      images: [...current.images, ""],
    }));
  }

  function removeImageField(index) {
    setProductForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const images = productForm.images
      .map((image) => image.trim())
      .filter(Boolean);

    if (images.length < 3) {
      setError("Cada producto necesita al menos 3 imágenes.");
      return;
    }

    const payload = {
      sku: productForm.sku.trim(),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      images,
      categoryId: Number(productForm.categoryId),
    };

    setSaving(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct, payload);
        showSuccess("Producto actualizado correctamente.");
      } else {
        await createProduct(payload);
        showSuccess("Producto creado correctamente.");
      }

      closeProductForm();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No pudimos guardar el producto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
    };

    try {
      if (editingCategory) {
        await updateCategory(editingCategory, payload);
        showSuccess("Categoría actualizada correctamente.");
      } else {
        await createCategory(payload);
        showSuccess("Categoría creada correctamente.");
      }

      closeCategoryForm();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No pudimos guardar la categoría."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product) {
    const action = product.active ? "desactivar" : "activar";

    if (!window.confirm(`¿Querés ${action} este producto?`)) {
      return;
    }

    try {
      if (product.active) {
        await deactivateProduct(product.id);
      } else {
        await activateProduct(product.id);
      }

      showSuccess(
        product.active
          ? "Producto desactivado."
          : "Producto activado."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No pudimos cambiar el estado del producto."
      );
    }
  }

  async function toggleCategory(category) {
    const action = category.active ? "desactivar" : "activar";

    if (!window.confirm(`¿Querés ${action} esta categoría?`)) {
      return;
    }

    try {
      if (category.active) {
        await deactivateCategory(category.id);
      } else {
        await activateCategory(category.id);
      }

      showSuccess(
        category.active
          ? "Categoría desactivada."
          : "Categoría activada."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No pudimos cambiar el estado de la categoría."
      );
    }
  }

  const activeCategories = categories.filter(
    (category) => category.active
  );

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">PANEL DE CONTROL</span>
          <h1>Administración</h1>
          <p>Gestioná el catálogo de tu tienda.</p>
        </div>

        <button
          className="admin-refresh"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </header>

      <section className="admin-stats">
        <article className="admin-stat">
          <Package size={23} />
          <div>
            <span>Productos</span>
            <strong>{products.length}</strong>
          </div>
        </article>

        <article className="admin-stat">
          <Tags size={23} />
          <div>
            <span>Categorías</span>
            <strong>{categories.length}</strong>
          </div>
        </article>

        <article className="admin-stat">
          <div className="admin-stat-dot" />
          <div>
            <span>Productos activos</span>
            <strong>
              {products.filter((product) => product.active).length}
            </strong>
          </div>
        </article>
      </section>

      <nav className="admin-tabs">
        <button
          className={section === "products" ? "selected" : ""}
          onClick={() => {
            setSection("products");
            setError("");
            setSuccess("");
          }}
        >
          <Package size={18} />
          Productos
        </button>

        <button
          className={section === "categories" ? "selected" : ""}
          onClick={() => {
            setSection("categories");
            setError("");
            setSuccess("");
          }}
        >
          <Tags size={18} />
          Categorías
        </button>
      </nav>

      {error && <div className="admin-alert error">{error}</div>}
      {success && <div className="admin-alert success">{success}</div>}

      {loading ? (
        <div className="admin-loading">Cargando administración...</div>
      ) : (
        <>
          {section === "products" && (
            <section className="admin-content">
              <div className="admin-section-heading">
                <div>
                  <h2>Productos</h2>
                  <p>Administrá los artículos de tu catálogo.</p>
                </div>

                <button
                  className="admin-primary-button"
                  onClick={startNewProduct}
                  disabled={activeCategories.length === 0}
                >
                  <Plus size={18} />
                  Nuevo producto
                </button>
              </div>

              {products.length === 0 ? (
                <div className="admin-empty">
                  <Package size={35} />
                  <h3>Tu catálogo está vacío</h3>
                  <p>Creá tu primer producto para comenzar.</p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>SKU</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="admin-product-cell">
                              <img
                                src={product.images?.[0]}
                                alt={product.name}
                              />
                              <strong>{product.name}</strong>
                            </div>
                          </td>

                          <td>{product.sku}</td>
                          <td>{product.categoryName}</td>
                          <td>
                            {Number(product.price).toLocaleString("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            })}
                          </td>
                          <td>{product.stock}</td>

                          <td>
                            <span
                              className={`admin-status ${
                                product.active ? "active" : "inactive"
                              }`}
                            >
                              {product.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>

                          <td>
                          <div className="admin-row-actions">
                            <button
                              title="Editar"
                              onClick={() => startEditProduct(product)}
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              title={product.active ? "Desactivar" : "Activar"}
                              onClick={() => toggleProduct(product)}
                            >
                              <Power size={17} />
                            </button>

                            <button
                              title="Eliminar definitivamente"
                              className="delete-button"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {section === "categories" && (
            <section className="admin-content">
              <div className="admin-section-heading">
                <div>
                  <h2>Categorías</h2>
                  <p>Organizá los productos de tu tienda.</p>
                </div>

                <button
                  className="admin-primary-button"
                  onClick={startNewCategory}
                >
                  <Plus size={18} />
                  Nueva categoría
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="admin-empty">
                  <Tags size={35} />
                  <h3>Todavía no hay categorías</h3>
                  <p>Creá categorías para organizar tu catálogo.</p>
                </div>
              ) : (
                <div className="admin-category-grid">
                  {categories.map((category) => (
                    <article
                      className="admin-category-card"
                      key={category.id}
                    >
                      <div className="admin-category-icon">
                        <Tags size={22} />
                      </div>

                      <span
                        className={`admin-status ${
                          category.active ? "active" : "inactive"
                        }`}
                      >
                        {category.active ? "Activa" : "Inactiva"}
                      </span>

                      <h3>{category.name}</h3>

                      <p>
                        {category.description || "Sin descripción"}
                      </p>

                      <div className="admin-category-actions">
                        <button
                          onClick={() => startEditCategory(category)}
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          onClick={() => toggleCategory(category)}
                        >
                          <Power size={16} />
                          {category.active ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {showProductForm && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal">
            <header className="admin-modal-header">
              <div>
                <span>CATÁLOGO</span>
                <h2>
                  {editingProduct ? "Editar producto" : "Nuevo producto"}
                </h2>
              </div>

              <button onClick={closeProductForm}>
                <X size={21} />
              </button>
            </header>

            <form onSubmit={handleProductSubmit}>
              <div className="admin-form-grid">
                <label>
                  SKU
                  <input
                    value={productForm.sku}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        sku: e.target.value,
                      })
                    }
                    maxLength={50}
                    required
                  />
                </label>

                <label>
                  Nombre
                  <input
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        name: e.target.value,
                      })
                    }
                    maxLength={120}
                    required
                  />
                </label>

                <label className="full-width">
                  Descripción
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    maxLength={2000}
                    required
                  />
                </label>

                <label>
                  Precio (ARS)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        price: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Stock
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stock: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label className="full-width">
                  Categoría
                  <select
                    value={productForm.categoryId}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        categoryId: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccioná una categoría</option>

                    {activeCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="admin-image-fields full-width">
                  <div className="admin-image-heading">
                    <ImagePlus size={19} />
                    <strong>Imágenes del producto</strong>
                    <span>Mínimo 3</span>
                  </div>

                  {productForm.images.map((image, index) => (
                    <div className="admin-image-input" key={index}>
                      <input
                        type="url"
                        placeholder={`URL de imagen ${index + 1}`}
                        value={image}
                        onChange={(e) =>
                          updateImage(index, e.target.value)
                        }
                        required
                      />

                      {productForm.images.length > 3 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          title="Eliminar imagen"
                        >
                          <X size={17} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="admin-add-image"
                    onClick={addImageField}
                  >
                    <Plus size={16} />
                    Agregar otra imagen
                  </button>
                </div>
              </div>

              <footer className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={closeProductForm}
                >
                  Cancelar
                </button>

                <button
                  className="admin-primary-button"
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving ? "Guardando..." : "Guardar producto"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {showCategoryForm && (
        <div className="admin-modal-backdrop">
          <section className="admin-modal admin-category-modal">
            <header className="admin-modal-header">
              <div>
                <span>CATÁLOGO</span>
                <h2>
                  {editingCategory ? "Editar categoría" : "Nueva categoría"}
                </h2>
              </div>

              <button onClick={closeCategoryForm}>
                <X size={21} />
              </button>
            </header>

            <form onSubmit={handleCategorySubmit}>
              <div className="admin-form-grid">
                <label className="full-width">
                  Nombre
                  <input
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        name: e.target.value,
                      })
                    }
                    maxLength={80}
                    required
                  />
                </label>

                <label className="full-width">
                  Descripción
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        description: e.target.value,
                      })
                    }
                    maxLength={500}
                  />
                </label>
              </div>

              <footer className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={closeCategoryForm}
                >
                  Cancelar
                </button>

                <button
                  className="admin-primary-button"
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving ? "Guardando..." : "Guardar categoría"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
