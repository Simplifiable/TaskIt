import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  refreshToken: async () => null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshToken = async () => {
    try {
      if (!user) return null;
      const token = await user.getIdToken(true);
      return token;
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        toast({
          title: "Network Error",
          description: "Please check your internet connection",
          variant: "destructive",
        });
      } else if (error.code === 'auth/requires-recent-login') {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        // Force logout on session expiration
        await auth.signOut();
      }
      return null;
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Attempt to refresh token on auth state change
          await refreshToken();
        }
        setUser(user);
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      try {
        if (user) {
          await user.getIdToken(true);
        }
        setUser(user);
      } catch (error) {
        console.error("Token refresh error:", error);
        if (user) {
          toast({
            title: "Authentication Error",
            description: "Please try logging in again",
            variant: "destructive",
          });
          await auth.signOut();
        }
      }
    });

    // Periodic token refresh every 30 minutes
    const tokenRefreshInterval = setInterval(refreshToken, 30 * 60 * 1000);

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
      clearInterval(tokenRefreshInterval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);