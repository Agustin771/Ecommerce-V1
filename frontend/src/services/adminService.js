import api from "./api";

export async function getAdminProducts() {
  const { data } = await api.get("/api/products/admin/all");
  return data;
}

export async function createProduct(product) {
  const { data } = await api.post("/api/products", product);
  return data;
}

export async function updateProduct(id, product) {
  const { data } = await api.put(`/api/products/${id}`, product);
  return data;
}

export async function activateProduct(id) {
  await api.patch(`/api/products/${id}/activate`);
}

export async function deleteProduct(id) {
  await api.delete(`/api/products/${id}`);
}

export async function deactivateProduct(id) {
  await api.patch(`/api/products/${id}/deactivate`);
}

export async function getAdminCategories() {
  const { data } = await api.get("/api/categories/admin/all");
  return data;
}

export async function createCategory(category) {
  const { data } = await api.post("/api/categories", category);
  return data;
}

export async function updateCategory(id, category) {
  const { data } = await api.put(`/api/categories/${id}`, category);
  return data;
}

export async function activateCategory(id) {
  await api.patch(`/api/categories/${id}/activate`);
}

export async function deactivateCategory(id) {
  await api.patch(`/api/categories/${id}/deactivate`);
}
