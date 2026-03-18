import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface PlatformAdminContextType {
  isPlatformAdmin: boolean;
  loading: boolean;
}

const PlatformAdminContext = createContext<PlatformAdminContextType | undefined>(undefined);

export function PlatformAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPlatformAdmin = async () => {
      if (!user) {
        setIsPlatformAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_platform_admin', { _user_id: user.id });

        if (error) {
          console.error("Error checking platform admin status:", error);
          setIsPlatformAdmin(false);
        } else {
          setIsPlatformAdmin(data === true);
        }
      } catch (error) {
        console.error("Error checking platform admin:", error);
        setIsPlatformAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkPlatformAdmin();
  }, [user]);

  return (
    <PlatformAdminContext.Provider value={{ isPlatformAdmin, loading }}>
      {children}
    </PlatformAdminContext.Provider>
  );
}

export function usePlatformAdmin() {
  const context = useContext(PlatformAdminContext);
  if (context === undefined) {
    throw new Error("usePlatformAdmin must be used within a PlatformAdminProvider");
  }
  return context;
}
