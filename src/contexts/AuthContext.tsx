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
      
      // Force token refresh
      const token = await user.getIdToken(true);
      return token;
    } catch (error: any) {
      console.error("Token refresh error:", error);
      
      if (error.code === 'auth/network-request-failed') {
        toast({
          title: "Network Error",
          description: "Please check your internet connection",
          variant: "destructive",
        });
      } else if (error.code === 'auth/requires-recent-login' || 
                 error.message?.includes('TOKEN_EXPIRED')) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        // Force logout on session expiration
        await auth.signOut();
        setUser(null);
      }
      return null;
    }
  };

  useEffect(() => {
    let tokenRefreshInterval: NodeJS.Timeout;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Immediate token refresh on auth state change
          await refreshToken();
          setUser(user);
          
          // Set up periodic token refresh every 30 minutes
          tokenRefreshInterval = setInterval(refreshToken, 30 * 60 * 1000);
        } else {
          setUser(null);
          if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
          }
        }
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
          const token = await user.getIdToken(true);
          if (token) {
            setUser(user);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        if (user) {
          toast({
            title: "Authentication Error",
            description: "Please try logging in again",
            variant: "destructive",
          });
          await auth.signOut();
          setUser(null);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);