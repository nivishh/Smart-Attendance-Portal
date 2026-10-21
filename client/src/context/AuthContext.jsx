// client/src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authApi } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("sap_token"));
  const [loading, setLoading] = useState(true);

  // On mount, if we have a token, fetch /me to confirm it's valid
  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const savedToken = localStorage.getItem("sap_token");
      const savedUser = localStorage.getItem("sap_user");
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const resp = await authApi.me();
        if (mounted) {
          setUser(resp.user);
          setToken(savedToken);
        }
      } catch {
        localStorage.removeItem("sap_token");
        localStorage.removeItem("sap_user");
        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
      void savedUser;
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback((tokenValue, userValue) => {
    localStorage.setItem("sap_token", tokenValue);
    localStorage.setItem("sap_user", JSON.stringify(userValue));
    setToken(tokenValue);
    setUser(userValue);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem("sap_token");
    localStorage.removeItem("sap_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === "admin",
    isStudent: user?.role === "student",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export default AuthContext;
