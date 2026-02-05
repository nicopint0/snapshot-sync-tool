import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Check, Users, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { 
  springGentle, 
  springSubtle,
  hoverLiftEffect,
} from "@/lib/animations";

const plans = [
  {
    id: "individual",
    name: "Individual",
    description: "Para dentistas independientes",
    priceMonthlyCLP: 10000,
    priceYearlyCLP: 100000,
    priceMonthlyUSD: 11,
    priceYearlyUSD: 110,
    professionals: "1 profesional",
    icon: Users,
    features: [
      "1 profesional",
      "1 ubicación",
      "Soporte por email",
      "Gestión de pacientes",
      "Agenda y citas",
      "Presupuestos básicos",
    ],
    cta: "Comenzar gratis",
    popular: false,
  },
  {
    id: "profesional",
    name: "Profesional",
    description: "Para clínicas en crecimiento",
    priceMonthlyCLP: 20000,
    priceYearlyCLP: 200000,
    priceMonthlyUSD: 22,
    priceYearlyUSD: 220,
    professionals: "5 profesionales + 1 admin",
    icon: Building2,
    features: [
      "5 profesionales",
      "1 administrativo",
      "1 ubicación",
      "Soporte prioritario",
      "Reportes avanzados",
      "Integración WhatsApp",
    ],
    cta: "Comenzar gratis",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "Para clínicas establecidas",
    priceMonthlyCLP: 50000,
    priceYearlyCLP: 500000,
    priceMonthlyUSD: 55,
    priceYearlyUSD: 550,
    professionals: "20 profesionales + 5 admins",
    icon: Crown,
    features: [
      "20 profesionales",
      "5 administrativos",
      "3 ubicaciones",
      "Soporte premium 24/7",
      "Onboarding dedicado",
      "Funciones avanzadas",
    ],
    cta: "Comenzar gratis",
    popular: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springGentle,
  },
};

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { i18n } = useTranslation();

  const isSpanish = i18n.language === "es" || i18n.language === "pt";

  const formatPrice = (plan: typeof plans[0]) => {
    if (isSpanish) {
      const price = isYearly 
        ? Math.round(plan.priceYearlyCLP / 12) 
        : plan.priceMonthlyCLP;
      return `$${price.toLocaleString("es-CL")}`;
    }
    return `$${isYearly ? Math.round(plan.priceYearlyUSD / 12) : plan.priceMonthlyUSD}`;
  };

  const formatYearlyTotal = (plan: typeof plans[0]) => {
    if (isSpanish) {
      return `$${plan.priceYearlyCLP.toLocaleString("es-CL")} CLP`;
    }
    return `$${plan.priceYearlyUSD} USD`;
  };

  const getCurrency = () => (isSpanish ? "CLP" : "USD");

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={springGentle}
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

        <motion.div 
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              whileHover={hoverLiftEffect}
              className={cn(
                "bg-card rounded-2xl p-6 border-2 transition-all relative cursor-pointer",
                plan.popular ? "border-primary" : "border-border"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Más popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <motion.div 
                  className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-3"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={springSubtle}
                >
                  <plan.icon className="h-6 w-6 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <motion.span 
                  className="text-4xl font-bold text-foreground"
                  key={`${plan.id}-${isYearly}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springSubtle}
                >
                  {formatPrice(plan)}
                </motion.span>
                <span className="text-muted-foreground">/{getCurrency()}/mes</span>
                {isYearly && (
                  <motion.p 
                    className="text-sm text-primary mt-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={springSubtle}
                  >
                    Facturado anualmente ({formatYearlyTotal(plan)}/año)
                  </motion.p>
                )}
              </div>

              <p className="text-center text-sm font-medium text-muted-foreground mb-6 pb-6 border-b border-border">
                {plan.professionals}
              </p>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-start gap-2 text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...springSubtle, delay: i * 0.05 }}
                  >
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={springSubtle}
              >
                <Button
                  className={cn("w-full", plan.popular && "bg-primary hover:bg-primary/90")}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/auth/register">{plan.cta}</Link>
                </Button>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
