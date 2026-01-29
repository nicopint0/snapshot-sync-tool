import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";

const countries = [
  { code: "AR", name: "Argentina", flag: "🇦🇷", phoneCode: "+54" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", phoneCode: "+55" },
  { code: "CL", name: "Chile", flag: "🇨🇱", phoneCode: "+56" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", phoneCode: "+57" },
  { code: "ES", name: "España", flag: "🇪🇸", phoneCode: "+34" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", phoneCode: "+1" },
  { code: "MX", name: "México", flag: "🇲🇽", phoneCode: "+52" },
  { code: "PE", name: "Perú", flag: "🇵🇪", phoneCode: "+51" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", phoneCode: "+598" },
];

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  // Redirect if already logged in
  if (session) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const isFormValid =
    formData.clinicName.length >= 3 &&
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.country &&
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.number &&
    passwordsMatch &&
    formData.acceptTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);

    const { error } = await signUp({
      email: formData.email,
      password: formData.password,
      clinicName: formData.clinicName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      country: formData.country,
    });
    
    if (error) {
      toast.error(error.message || t("auth.registerError"));
      setIsLoading(false);
    } else {
      toast.success(t("auth.registerSuccess"));
      navigate("/dashboard");
    }
  };

  const PasswordCheck = ({ valid, label }: { valid: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {valid ? (
        <Check className="h-4 w-4 text-status-confirmed" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={valid ? "text-status-confirmed" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("auth.createYourAccount")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.startManaging")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Clinic Name */}
            <div className="space-y-2">
              <Label htmlFor="clinicName">{t("auth.clinicName")} *</Label>
              <Input
                id="clinicName"
                placeholder="Dental Smile Clinic"
                value={formData.clinicName}
                onChange={(e) =>
                  setFormData({ ...formData, clinicName: e.target.value })
                }
                required
                className="h-12"
              />
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("auth.firstName")} *</Label>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("auth.lastName")} *</Label>
                <Input
                  id="lastName"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  className="h-12"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")} *</Label>
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

            {/* Phone and Country row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t("auth.country")} *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData({ ...formData, country: value })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")} *</Label>
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
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <PasswordCheck valid={passwordChecks.length} label="Mínimo 8 caracteres" />
                  <PasswordCheck valid={passwordChecks.uppercase} label="Al menos 1 mayúscula" />
                  <PasswordCheck valid={passwordChecks.number} label="Al menos 1 número" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")} *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                className="h-12"
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, acceptTerms: checked as boolean })
                }
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                {t("auth.acceptTerms")}{" "}
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  {t("auth.termsAndConditions")}
                </button>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("auth.createAccount")
              )}
            </Button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link
              to="/auth/login"
              className="text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default Register;
