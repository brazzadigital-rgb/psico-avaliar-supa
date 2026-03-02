import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";


type UserRole = "admin" | "receptionist" | "professional" | "client" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isClient: boolean;
  userRole: UserRole;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const isAdmin = userRole === "admin" || userRole === "receptionist" || userRole === "professional";
  const isClient = userRole === "client";

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async (userId: string): Promise<UserRole> => {
      try {
        const rolePromise = (async () => {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();
          if (error) throw error;
          return (data?.role as UserRole) ?? null;
        })();

        const timeoutPromise = new Promise<UserRole>((resolve) => {
          window.setTimeout(() => resolve(null), 5000);
        });

        return await Promise.race([rolePromise, timeoutPromise]);
      } catch {
        return null;
      }
    };

    const applySession = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      try {
        if (nextSession?.user) {
          const role = await fetchRole(nextSession.user.id);
          if (!isMounted) return;
          setUserRole(role);
        } else {
          setUserRole(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    // THEN existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      // "local" garante limpeza imediata do armazenamento do navegador
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      // Fallback extra (para casos de sessão “presa” no storage)
      for (const key of Object.keys(localStorage)) {
        if (key.includes("auth-token") || key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      }

      setUserRole(null);
      setUser(null);
      setSession(null);

      window.location.assign("/");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isAdmin, 
      isClient, 
      userRole, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
