import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Users, MapPin, Headphones, Building2, Crown, Loader2, CreditCard, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubscription, PaymentProvider } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
    priceCLP: 15000,
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
    priceCLP: 40000,
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

const SubscriptionSection = () => {
  const { i18n } = useTranslation();
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("stripe");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    subscribed,
    plan: currentPlan,
    subscriptionEnd,
    provider: activeProvider,
    isLoading,
    createCheckout,
    openCustomerPortal,
    checkSubscription,
  } = useSubscription();

  const isSpanish = i18n.language === "es" || i18n.language === "pt";

  const formatPrice = (plan: Plan, provider: PaymentProvider) => {
    if (provider === "mercadopago") {
      return `$${plan.priceCLP.toLocaleString("es-CL")} CLP`;
    }
    return `$${plan.priceUSD} USD`;
  };

  const getCurrentPlan = () => {
    if (!subscribed || currentPlan === "free") {
      return null;
    }
    return plans.find((p) => p.id === currentPlan);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    try {
      const success = await createCheckout(selectedPlan, selectedProvider);
      if (success) {
        setShowChangePlan(false);
        setSelectedPlan(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    try {
      await openCustomerPortal();
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activePlan = getCurrentPlan();

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Tu Plan Actual</CardTitle>
          <CardDescription>Detalles de tu suscripción actual</CardDescription>
        </CardHeader>
        <CardContent>
          {activePlan ? (
            <>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Plan {activePlan.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">Facturación mensual</p>
                        {activeProvider && (
                          <Badge variant="outline" className="text-xs">
                            {activeProvider === "stripe" ? "💳 Stripe" : "💙 MercadoPago"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl">
                      {formatPrice(activePlan, activeProvider || "stripe")}
                    </p>
                    <p className="text-sm text-muted-foreground">/mes</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{activePlan.professionals} profesional(es)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{activePlan.locations} ubicación(es)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-muted-foreground" />
                    <span>Soporte {activePlan.support}</span>
                  </div>
                </div>

                {subscriptionEnd && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Próxima renovación: {format(new Date(subscriptionEnd), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => setShowChangePlan(true)} 
                  variant="outline" 
                  className="flex-1"
                >
                  Cambiar Plan
                </Button>
                {activeProvider === "stripe" && (
                  <Button 
                    onClick={handleManageSubscription}
                    variant="secondary"
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Gestionar Suscripción
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="p-6 rounded-lg bg-muted/50 border border-dashed text-center">
              <div className="mx-auto p-3 rounded-full bg-muted w-fit mb-4">
                <Crown className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Plan Gratuito</h3>
              <p className="text-muted-foreground mb-4">
                Actualmente estás usando el plan gratuito con funcionalidades limitadas.
                Mejora a un plan premium para desbloquear todas las características.
              </p>
              <Button onClick={() => setShowChangePlan(true)}>
                <Crown className="h-4 w-4 mr-2" />
                Elegir un Plan
              </Button>
            </div>
          )}

          <Button 
            onClick={checkSubscription} 
            variant="ghost" 
            size="sm" 
            className="mt-4 w-full text-muted-foreground"
          >
            Actualizar estado de suscripción
          </Button>
        </CardContent>
      </Card>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlan} onOpenChange={setShowChangePlan}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Elegir Plan</DialogTitle>
            <DialogDescription>
              Selecciona el plan que mejor se adapte a las necesidades de tu clínica
            </DialogDescription>
          </DialogHeader>

          {/* Payment Provider Selection */}
          <div className="p-4 rounded-lg bg-muted/50 border mb-4">
            <Label className="text-sm font-medium mb-3 block">Método de pago</Label>
            <RadioGroup
              value={selectedProvider}
              onValueChange={(v) => setSelectedProvider(v as PaymentProvider)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[#635BFF] font-bold">💳 Stripe</span>
                  <span className="text-xs text-muted-foreground">(USD - Internacional)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mercadopago" id="mercadopago" />
                <Label htmlFor="mercadopago" className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[#00B1EA] font-bold">💙 MercadoPago</span>
                  <span className="text-xs text-muted-foreground">(CLP - Latinoamérica)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlan === plan.id
                    ? "ring-2 ring-primary border-primary"
                    : currentPlan === plan.id && subscribed
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
                {currentPlan === plan.id && subscribed && (
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
                    <span className="text-2xl font-bold">
                      {formatPrice(plan, selectedProvider)}
                    </span>
                    <span className="text-muted-foreground text-sm">/mes</span>
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
                    disabled={currentPlan === plan.id && subscribed}
                  >
                    {currentPlan === plan.id && subscribed
                      ? "Plan Actual"
                      : selectedPlan === plan.id
                      ? "Seleccionado"
                      : "Seleccionar"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPlan && (currentPlan !== selectedPlan || !subscribed) && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-center mb-4">
                ¿Confirmar suscripción al plan <strong>{plans.find(p => p.id === selectedPlan)?.name}</strong>?
                <br />
                <span className="text-muted-foreground">
                  Pago con {selectedProvider === "stripe" ? "💳 Stripe" : "💙 MercadoPago"} - Serás redirigido a la página de pago segura
                </span>
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setSelectedPlan(null)} disabled={isProcessing}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmChange} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ir al Pago
                    </>
                  )}
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
