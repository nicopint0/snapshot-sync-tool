import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  User,
  Building2,
  Users,
  Clock,
  Bell,
  CreditCard,
  Save,
  Loader2,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layout/AppLayout";
import IntegrationsSection from "@/components/settings/IntegrationsSection";
import ProfessionalSchedule from "@/components/settings/ProfessionalSchedule";
import SubscriptionSection from "@/components/settings/SubscriptionSection";
import UsersManagementSection from "@/components/settings/UsersManagementSection";
import { useAuth } from "@/hooks/useAuth";
import { 
  pageVariants, 
  fadeUpVariants,
  cardVariants,
  springSubtle,
} from "@/lib/animations";

type SettingsSection = "profile" | "clinic" | "users" | "schedule" | "notifications" | "integrations" | "subscription";

const Settings = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [isLoading, setIsLoading] = useState(false);
  // currentPlan is now managed by useSubscription hook in SubscriptionSection

  const sections = [
    { id: "profile" as const, label: "Perfil de Usuario", icon: User },
    { id: "clinic" as const, label: "Datos de la Clínica", icon: Building2 },
    { id: "users" as const, label: "Usuarios y Permisos", icon: Users },
    { id: "schedule" as const, label: "Horarios", icon: Clock },
    { id: "notifications" as const, label: "Notificaciones", icon: Bell },
    { id: "integrations" as const, label: "Integraciones", icon: Plug },
    { id: "subscription" as const, label: "Suscripción", icon: CreditCard },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" defaultValue={profile?.first_name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input id="lastName" defaultValue={profile?.last_name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={profile?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" defaultValue={profile?.phone || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Input id="specialty" defaultValue={profile?.specialty || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">Número de Licencia</Label>
                  <Input id="license" defaultValue={profile?.license_number || ""} />
                </div>
              </div>
              <Button disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        );

      case "clinic":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Clínica</CardTitle>
              <CardDescription>Información de tu clínica dental</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clinicName">Nombre de la Clínica</Label>
                  <Input id="clinicName" placeholder="Mi Clínica Dental" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clinicAddress">Dirección</Label>
                  <Input id="clinicAddress" placeholder="Av. Principal 123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone">Teléfono</Label>
                  <Input id="clinicPhone" placeholder="+52 55 1234 5678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicEmail">Email</Label>
                  <Input id="clinicEmail" type="email" placeholder="contacto@clinica.com" />
                </div>
              </div>
              <Button disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        );

      case "users":
        return <UsersManagementSection />;

      case "schedule":
        return <ProfessionalSchedule />;

      case "notifications":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Configura cómo recibes las notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorios de citas</p>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones de próximas citas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nuevos pacientes</p>
                  <p className="text-sm text-muted-foreground">Notificación cuando se registra un paciente</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pagos recibidos</p>
                  <p className="text-sm text-muted-foreground">Confirmación de pagos procesados</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones por email</p>
                  <p className="text-sm text-muted-foreground">Recibe resúmenes diarios por email</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        );

      case "integrations":
        return <IntegrationsSection />;

      case "subscription":
        return <SubscriptionSection />;

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUpVariants}>
          <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-muted-foreground">Administra la configuración de tu cuenta y clínica</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div variants={cardVariants}>
            <Card className="lg:col-span-1 h-fit">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <motion.button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      whileHover={{ x: 4, transition: springSubtle }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <section.icon className="h-4 w-4" />
                      {section.label}
                    </motion.button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content */}
          <motion.div 
            className="lg:col-span-3"
            variants={cardVariants}
            key={activeSection}
            initial="hidden"
            animate="visible"
          >
            {renderContent()}
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Settings;
