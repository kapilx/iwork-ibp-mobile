import { createContext, useContext, useState, useEffect } from "react";
import { axiosInstance, endPoints, resetPermissions } from "@ui/ui-lib";
import { ALERT_MESSAGES } from "../constants";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";

interface AuthContextType {
  user: unknown | null;
  loading: boolean;
  signIn: (userData: object) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const signIn = async (userData: object) => {
    setUser(userData);
    await sessionStorage.setItem("user", JSON.stringify(userData));
  };

  const dispatch = useDispatch();
  const signOut = async () => {
    try {
      await axiosInstance.post(endPoints.logout, {});
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      // Clear client state after attempting server logout to ensure the server can revoke
      // the active session (prevents stale server sessions that would block future logins).
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      setUser(null);
      queryClient.clear();
      dispatch(resetPermissions());
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
