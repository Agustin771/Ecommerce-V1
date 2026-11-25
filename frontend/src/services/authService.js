import api, {
  ensureCsrfToken,
  refreshAccessToken,
} from "./api";

export async function loginUser(credentials) {
  await ensureCsrfToken();

  const { data } = await api.post("/auth/login", credentials);
  return data;
}

export async function registerUser(userData) {
  await ensureCsrfToken();

  const { data } = await api.post("/auth/register", userData);
  return data;
}

export async function verifyAccount(data) {
  await ensureCsrfToken();

  const response = await api.post("/auth/verify", data);
  return response.data;
}

export async function resendVerification(email) {
  await ensureCsrfToken();

  const { data } = await api.post("/auth/resend-verification", {
    email,
  });

  return data;
}

export async function getVerificationStatus(email) {
  const { data } = await api.get("/auth/verification-status", {
    params: { email },
  });

  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function refreshSession() {
  const token = await refreshAccessToken();

  return { token };
}

export async function logoutUser() {
  await ensureCsrfToken();

  const { data } = await api.post("/auth/logout");
  return data;
}

export async function requestPasswordRecovery(email) {
  await ensureCsrfToken();

  const { data } = await api.post("/auth/forgot-password", {
    email,
  });

  return data;
}

export async function resetUserPassword(passwordData) {
  await ensureCsrfToken();

  const { data } = await api.post("/auth/reset-password", passwordData);
  return data;
}
