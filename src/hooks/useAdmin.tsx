import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UseAdminResult {
  isAdmin: boolean;
  isLoading: boolean;
  role: string | null;
}

export const useAdmin = (): UseAdminResult => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("is_admin", {
          check_user_id: user.id,
        });

        if (error) throw error;

        const admin = Boolean(data);
        setIsAdmin(admin);
        setRole(admin ? "admin" : "customer");
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, isLoading, role };
};
