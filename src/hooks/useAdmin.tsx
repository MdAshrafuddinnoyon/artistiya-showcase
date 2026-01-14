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
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          // No role found = customer
          setIsAdmin(false);
          setRole("customer");
        } else {
          setRole(data.role);
          setIsAdmin(data.role === "admin");
        }
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
