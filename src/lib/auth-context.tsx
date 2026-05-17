import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (uid: string | undefined) => {
    if (!uid) { setIsAdmin(false); return; }
    // Try multiple times if needed, sometimes RLS takes a moment to recognize the session
    let attempts = 0;
    let hasAdminRole = false;
    let lastData = null;

    while (attempts < 3 && !hasAdminRole) {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (error) {
        console.error("Error checking admin status (attempt " + (attempts + 1) + "):", error);
      } else {
        lastData = data;
        hasAdminRole = !!data?.some((r) => r.role === "admin");
        if (hasAdminRole) break;
      }
      attempts++;
      if (!hasAdminRole && attempts < 3) await new Promise(r => setTimeout(r, 500));
    }

    console.log("Admin check for", uid, ":", hasAdminRole, lastData);
    setIsAdmin(hasAdminRole);
  };

   useEffect(() => {
     if (typeof window === "undefined") {
       setLoading(false);
       return;
     }
     const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
       setSession(s); setUser(s?.user ?? null);
       setTimeout(() => checkAdmin(s?.user?.id), 0);
     });
     supabase.auth.getSession().then(({ data: { session: s } }) => {
       setSession(s); setUser(s?.user ?? null);
       checkAdmin(s?.user?.id).finally(() => setLoading(false));
     });
     return () => subscription.unsubscribe();
   }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return <Ctx.Provider value={{ user, session, isAdmin, loading, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
};
