import api from "./api";

export async function getProducts({
  page = 0,
  size = 12,
  name = "",
  categoryId = "",
} = {}) {
  const params = { page, size };

  if (name.trim()) params.name = name.trim();
  if (categoryId) params.categoryId = categoryId;

  const { data } = await api.get("/api/products", { params });
  return data;
}

export async function getProductById(id) {
  const { data } = await api.get(`/api/products/${id}`);
  return data;
}

export async function getCategories() {
  const { data } = await api.get("/api/categories");
  return data;
}
