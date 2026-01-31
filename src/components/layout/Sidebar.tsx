import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useTranslation();
  const location = useLocation();

  const navigationItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), path: "/dashboard" },
    { icon: Calendar, label: t("nav.appointments"), path: "/appointments" },
    { icon: Users, label: t("nav.patients"), path: "/patients" },
    { icon: Stethoscope, label: t("nav.treatments"), path: "/treatments" },
    { icon: FileText, label: t("nav.budgets"), path: "/budgets" },
    { icon: CreditCard, label: t("nav.payments"), path: "/payments" },
    { icon: MessageSquare, label: t("nav.whatsapp"), path: "/whatsapp" },
    { icon: BarChart3, label: t("nav.reports"), path: "/reports" },
    { icon: Settings, label: t("nav.settings"), path: "/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: typeof navigationItems[0] }) => (
    <Link
      to={item.path}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
        isActive(item.path)
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium">{item.label}</span>
    </Link>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-sidebar-foreground"
            >
              <path d="M12 2C9.5 2 7.5 3.5 7 6c-.5 2.5.5 4.5 1 7 .5 2.5 0 5 0 7 0 1 1 2 2 2s2-1 2-3c0 2 1 3 2 3s2-1 2-2c0-2-.5-4.5 0-7s1.5-4.5 1-7c-.5-2.5-2.5-4-5-4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Denty.io</h1>
            <p className="text-xs text-sidebar-foreground/60">Tu clínica, más inteligente</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-sidebar-border/30">
        <button
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{t("auth.logout")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:flex-col bg-sidebar">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar lg:hidden"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
