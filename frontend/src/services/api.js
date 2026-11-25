import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie
    ? decodeURIComponent(cookie.substring(name.length + 1))
    : null;
}

let csrfPromise = null;

export async function ensureCsrfToken() {
  if (!csrfPromise) {
    csrfPromise = api.get("/auth/csrf").finally(() => {
      csrfPromise = null;
    });
  }

  await csrfPromise;
}

let refreshPromise = null;

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { data } = await api.post("/auth/refresh");

      if (!data?.token) {
        throw new Error("No pudimos renovar tu sesión.");
      }

      setAccessToken(data.token);

      return data.token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// REQUEST INTERCEPTOR
api.interceptors.request.use(async (config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  const method = config.method?.toUpperCase();

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    // Solicitamos un token actualizado antes de cada operación.
    await ensureCsrfToken();

    const csrfToken = getCookie("XSRF-TOKEN");

    if (!csrfToken) {
      throw new Error("No pudimos validar la seguridad de la solicitud.");
    }

    config.headers["X-XSRF-TOKEN"] = csrfToken;
  }

  return config;
});

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const url = originalRequest.url ?? "";

    const isAuthRequest = [
      "/auth/login",
      "/auth/register",
      "/auth/verify",
      "/auth/refresh",
      "/auth/logout",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/csrf",
    ].some((endpoint) => url.includes(endpoint));

    if (isAuthRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
