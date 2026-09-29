import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUserAvatar,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();

      setUser(response.data);

      return response.data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const register = useCallback(async (credentials) => {
    const response = await registerUser(credentials);

    setUser(response.data);

    return response.data;
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await loginUser(credentials);

    setUser(response.data);

    return response.data;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const changeAvatar = useCallback(async (avatar) => {
    const response = await updateUserAvatar(avatar);

    setUser(response.data);

    return response.data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      register,
      login,
      logout,
      changeAvatar,
      refreshUser,
    }),
    [
      user,
      loading,
      register,
      login,
      logout,
      changeAvatar,
      refreshUser,
    ]
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
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
