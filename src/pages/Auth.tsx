import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Auth page now redirects to home - login is handled via popup modal
const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If already logged in, go to dashboard; otherwise go home
    navigate(user ? "/dashboard" : "/", { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Auth;
