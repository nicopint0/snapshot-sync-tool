import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login - will be replaced with Supabase auth
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success(t("auth.loginSuccess"));
    navigate("/dashboard");
    setIsLoading(false);
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("auth.welcomeBack")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.enterCredentials")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  {t("auth.rememberMe")}
                </Label>
              </div>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("auth.login")
              )}
            </Button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link
              to="/auth/register"
              className="text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              {t("auth.register")}
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default Login;
