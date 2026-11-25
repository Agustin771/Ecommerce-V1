import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearAccessToken,
  setAccessToken,
} from "../services/api";

import {
  loginUser,
  registerUser,
  getCurrentUser,
  refreshSession,
  logoutUser,
} from "../services/authService";

import { clearLocalCart } from "../utils/cartStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const loadUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const result = await refreshSession();

        if (cancelled) return;

        setAccessToken(result.token);

        const currentUser = await getCurrentUser();

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (error) {
        if (!cancelled) {
          clearAccessToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAuth(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(credentials) {
    const result = await loginUser(credentials);

    setAccessToken(result.token);

    try {
      const currentUser = await loadUser();
      return currentUser;
    } catch (error) {
      clearAccessToken();
      setUser(null);
      throw error;
    }
  }

  async function register(userData) {
    return registerUser(userData);
  }

  async function logout() {
    try {
      await logoutUser();
    } finally {
      clearAccessToken();
      clearLocalCart();
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loadingAuth,
      isAuthenticated: Boolean(user),
      isAdmin: user?.roles?.includes("ROLE_ADMIN") ?? false,
      login,
      register,
      logout,
      loadUser,
    }),
    [user, loadingAuth, loadUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider"
    );
  }

  return context;
}
