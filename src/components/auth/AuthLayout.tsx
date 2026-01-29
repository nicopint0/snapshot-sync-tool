import { ReactNode } from "react";
import { motion } from "framer-motion";
import LanguageSelector from "@/components/common/LanguageSelector";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-md"
          >
            {/* Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-12 h-12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3c-1.5 0-3 1-3.5 2.5C8 7 6.5 8 5 8c-2 0-3 2-2.5 4 .5 2 2 3.5 4 4.5 1 .5 2 2 2.5 4.5.3 1.5 1.5 2.5 3 2.5s2.7-1 3-2.5c.5-2.5 1.5-4 2.5-4.5 2-1 3.5-2.5 4-4.5.5-2-.5-4-2.5-4-1.5 0-3-1-3.5-2.5C16.5 4 15 3 12 3z"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4">DentalCRM Pro</h1>
              <p className="text-xl text-white/80">
                Tu consultorio dental, simplificado con IA
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 text-left">
              {[
                "Gestiona citas y pacientes fácilmente",
                "Automatiza recordatorios por WhatsApp",
                "Genera presupuestos profesionales",
                "Accede desde cualquier dispositivo",
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-white/90">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Language selector */}
        <div className="absolute top-6 right-6 z-20">
          <LanguageSelector />
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden pt-8 pb-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-6 h-6 text-primary-foreground"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c-1.5 0-3 1-3.5 2.5C8 7 6.5 8 5 8c-2 0-3 2-2.5 4 .5 2 2 3.5 4 4.5 1 .5 2 2 2.5 4.5.3 1.5 1.5 2.5 3 2.5s2.7-1 3-2.5c.5-2.5 1.5-4 2.5-4.5 2-1 3.5-2.5 4-4.5.5-2-.5-4-2.5-4-1.5 0-3-1-3.5-2.5C16.5 4 15 3 12 3z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">DentalCRM Pro</span>
          </div>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
