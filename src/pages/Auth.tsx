import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Calculator, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { z } from "zod";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

// Math CAPTCHA hook
const useMathCaptcha = () => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState<'+' | '-' | '×'>('+');
  const [answer, setAnswer] = useState(0);

  const generateCaptcha = useCallback(() => {
    const operators: ('+' | '-' | '×')[] = ['+', '-', '×'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let n1 = Math.floor(Math.random() * 10) + 1;
    let n2 = Math.floor(Math.random() * 10) + 1;
    
    // Ensure subtraction doesn't go negative
    if (op === '-' && n2 > n1) {
      [n1, n2] = [n2, n1];
    }
    
    // Keep multiplication small
    if (op === '×') {
      n1 = Math.floor(Math.random() * 5) + 1;
      n2 = Math.floor(Math.random() * 5) + 1;
    }

    let result = 0;
    switch (op) {
      case '+': result = n1 + n2; break;
      case '-': result = n1 - n2; break;
      case '×': result = n1 * n2; break;
    }

    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setAnswer(result);
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  return { num1, num2, operator, answer, regenerate: generateCaptcha };
};

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [captchaInput, setCaptchaInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const navigate = useNavigate();
  const { num1, num2, operator, answer, regenerate } = useMathCaptcha();

  // Role-based redirect: Admin -> /admin, Customer -> /
  useEffect(() => {
    if (user && !isAdminLoading) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, isAdmin, isAdminLoading, navigate]);

  const validateForm = () => {
    try {
      if (mode === "signup") {
        signUpSchema.parse(formData);
      } else {
        signInSchema.parse({ email: formData.email, password: formData.password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Validate CAPTCHA
    if (parseInt(captchaInput) !== answer) {
      setErrors({ ...errors, captcha: "Incorrect answer, please try again" });
      regenerate();
      setCaptchaInput("");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("An account with this email already exists");
          } else {
            toast.error(error.message);
          }
          regenerate();
          setCaptchaInput("");
        } else {
          toast.success("Account created successfully!");
          navigate("/");
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
          regenerate();
          setCaptchaInput("");
        } else {
          toast.success("Welcome back!");
          navigate("/");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 md:pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-elevated"
          >
            {/* Logo */}
            <div className="text-center mb-6 md:mb-8">
              <h1 className="font-display text-2xl md:text-3xl">
                <span className="text-gold">artistiya</span>
                <span className="text-foreground">.store</span>
              </h1>
              <p className="text-muted-foreground mt-2 font-body text-sm">
                {mode === "signin" ? "Sign in to your account" : "Create a new account"}
              </p>
            </div>

            {/* Toggle */}
            <div className="flex bg-muted rounded-lg p-1 mb-6">
              <button
                onClick={() => { setMode("signin"); regenerate(); setCaptchaInput(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "signin"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode("signup"); regenerate(); setCaptchaInput(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "signup"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    key="fullName"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label htmlFor="fullName" className="text-foreground text-sm">
                      Full Name
                    </Label>
                    <div className="relative mt-1">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Your name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-9 h-10"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-destructive text-xs mt-1">{errors.fullName}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="email" className="text-foreground text-sm">
                  Email
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9 h-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-foreground text-sm">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-9 pr-10 h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Math CAPTCHA */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <Label className="text-foreground text-sm flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-gold" />
                  Security Verification
                </Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-background rounded-lg px-4 py-2.5 text-center font-mono text-lg border border-border">
                    {num1} {operator} {num2} = ?
                  </div>
                  <button
                    type="button"
                    onClick={() => { regenerate(); setCaptchaInput(""); }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="New question"
                  >
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="relative mt-2">
                  <Input
                    type="number"
                    placeholder="Enter answer"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="h-10 text-center font-mono"
                  />
                </div>
                {errors.captcha && (
                  <p className="text-destructive text-xs mt-1">{errors.captcha}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="gold"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Please wait...
                  </span>
                ) : mode === "signin" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => { setMode("signup"); regenerate(); }}
                    className="text-gold hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => { setMode("signin"); regenerate(); }}
                    className="text-gold hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
