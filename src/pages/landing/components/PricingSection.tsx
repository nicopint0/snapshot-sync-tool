import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    description: "Para dentistas independientes",
    priceMonthly: 19,
    priceYearly: 190,
    professionals: "1 profesional",
    features: [
      "Agenda ilimitada",
      "500 pacientes",
      "Dashboard básico",
      "50 WhatsApp/mes",
      "Soporte email",
    ],
    cta: "Comenzar gratis",
    popular: false,
  },
  {
    name: "Professional",
    description: "Para clínicas en crecimiento",
    priceMonthly: 49,
    priceYearly: 490,
    professionals: "Hasta 3 profesionales",
    features: [
      "Pacientes ilimitados",
      "Reservas online públicas",
      "Ficha clínica + Odontograma",
      "Sistema de caja",
      "200 WhatsApp/mes",
      "Soporte chat prioritario",
    ],
    cta: "Comenzar gratis",
    popular: true,
  },
  {
    name: "Business",
    description: "Para clínicas establecidas",
    priceMonthly: 99,
    priceYearly: 990,
    professionals: "Hasta 10 profesionales",
    features: [
      "Todo de Professional",
      "Inventario básico",
      "Email marketing",
      "Encuestas NPS",
      "IA Denty básico",
      "500 WhatsApp/mes",
      "API acceso",
    ],
    cta: "Comenzar gratis",
    popular: false,
  },
  {
    name: "Enterprise",
    description: "Para cadenas y clínicas premium",
    priceMonthly: 199,
    priceYearly: 1990,
    professionals: "Profesionales ilimitados",
    features: [
      "Todo de Business",
      "Multi-sucursal (5)",
      "Facturación electrónica",
      "IA Denty completo",
      "WhatsApp ilimitado",
      "Soporte 24/7",
      "Onboarding dedicado",
    ],
    cta: "Contactar ventas",
    popular: false,
  },
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planes simples, sin sorpresas
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              14 días gratis en cualquier plan. Sin tarjeta de crédito.
            </p>

            <div className="flex items-center justify-center gap-4">
              <span className={cn("text-sm", !isYearly && "font-semibold text-foreground")}>
                Mensual
              </span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} />
              <span className={cn("text-sm flex items-center gap-2", isYearly && "font-semibold text-foreground")}>
                Anual
                <Badge variant="secondary" className="text-xs">2 meses gratis</Badge>
              </span>
            </div>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "bg-card rounded-2xl p-6 border-2 transition-all hover:shadow-lg relative",
                plan.popular ? "border-primary" : "border-border"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Más popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-foreground">
                  ${isYearly ? Math.round(plan.priceYearly / 12) : plan.priceMonthly}
                </span>
                <span className="text-muted-foreground">/mes</span>
                {isYearly && (
                  <p className="text-sm text-primary mt-1">
                    Facturado anualmente (${plan.priceYearly}/año)
                  </p>
                )}
              </div>

              <p className="text-center text-sm font-medium text-muted-foreground mb-6 pb-6 border-b border-border">
                {plan.professionals}
              </p>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn("w-full", plan.popular && "bg-primary hover:bg-primary/90")}
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link to="/auth/register">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
