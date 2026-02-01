import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Users, MapPin, Headphones, Building2, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Plan {
  id: string;
  name: string;
  priceCLP: number;
  priceUSD: number;
  professionals: number;
  admins: number;
  locations: number;
  support: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "individual",
    name: "Individual",
    priceCLP: 10000,
    priceUSD: 11,
    professionals: 1,
    admins: 0,
    locations: 1,
    support: "Email",
    features: [
      "1 profesional",
      "1 ubicación",
      "Soporte por email",
      "Gestión de pacientes",
      "Agenda y citas",
      "Presupuestos básicos",
    ],
  },
  {
    id: "profesional",
    name: "Profesional",
    priceCLP: 20000,
    priceUSD: 22,
    professionals: 5,
    admins: 1,
    locations: 1,
    support: "Prioritario",
    features: [
      "5 profesionales",
      "1 administrativo",
      "1 ubicación",
      "Soporte prioritario",
      "Reportes avanzados",
      "Integración WhatsApp",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    priceCLP: 50000,
    priceUSD: 55,
    professionals: 20,
    admins: 5,
    locations: 3,
    support: "Premium 24/7",
    features: [
      "20 profesionales",
      "5 administrativos",
      "3 ubicaciones",
      "Soporte premium 24/7",
      "Onboarding dedicado",
    ],
  },
];

interface SubscriptionSectionProps {
  currentPlan: string;
  onPlanChange: (plan: string) => void;
}

const SubscriptionSection = ({ currentPlan, onPlanChange }: SubscriptionSectionProps) => {
  const { i18n } = useTranslation();
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const isSpanish = i18n.language === "es" || i18n.language === "pt";

  const formatPrice = (plan: Plan) => {
    if (isSpanish) {
      return `$${plan.priceCLP.toLocaleString("es-CL")}`;
    }
    return `$${plan.priceUSD}`;
  };

  const getCurrency = () => {
    return isSpanish ? "CLP" : "USD";
  };

  const getCurrentPlan = () => plans.find((p) => p.id === currentPlan);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleConfirmChange = () => {
    if (selectedPlan) {
      onPlanChange(selectedPlan);
      setShowChangePlan(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Tu Plan Actual</CardTitle>
          <CardDescription>Detalles de tu suscripción actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">Plan {getCurrentPlan()?.name}</p>
                  <p className="text-sm text-muted-foreground">Facturación mensual</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-2xl">{formatPrice(getCurrentPlan()!)}</p>
                <p className="text-sm text-muted-foreground">/{getCurrency()} /mes</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{getCurrentPlan()?.professionals} profesional(es)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{getCurrentPlan()?.locations} ubicación(es)</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-muted-foreground" />
                <span>Soporte {getCurrentPlan()?.support}</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setShowChangePlan(true)} 
            variant="outline" 
            className="w-full mt-4"
          >
            Cambiar Plan
          </Button>
        </CardContent>
      </Card>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlan} onOpenChange={setShowChangePlan}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cambiar Plan</DialogTitle>
            <DialogDescription>
              Selecciona el plan que mejor se adapte a las necesidades de tu clínica
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlan === plan.id
                    ? "ring-2 ring-primary border-primary"
                    : currentPlan === plan.id
                    ? "border-primary/50 bg-primary/5"
                    : ""
                }`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Más Popular
                  </Badge>
                )}
                {currentPlan === plan.id && (
                  <Badge variant="secondary" className="absolute -top-2 right-2">
                    Actual
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
                    {plan.id === "individual" && <Users className="h-6 w-6 text-primary" />}
                    {plan.id === "profesional" && <Building2 className="h-6 w-6 text-primary" />}
                    {plan.id === "business" && <Crown className="h-6 w-6 text-primary" />}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{formatPrice(plan)}</span>
                    <span className="text-muted-foreground text-sm">/{getCurrency()}/mes</span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-4"
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    disabled={currentPlan === plan.id}
                  >
                    {currentPlan === plan.id
                      ? "Plan Actual"
                      : selectedPlan === plan.id
                      ? "Seleccionado"
                      : "Seleccionar"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPlan && selectedPlan !== currentPlan && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-center mb-4">
                ¿Confirmar cambio al plan <strong>{plans.find(p => p.id === selectedPlan)?.name}</strong>?
                <br />
                <span className="text-muted-foreground">
                  Se aplicará en tu próximo ciclo de facturación
                </span>
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmChange}>
                  Confirmar Cambio
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionSection;
