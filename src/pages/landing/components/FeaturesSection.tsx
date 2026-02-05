import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  FileText,
  CreditCard,
  MessageCircle,
  BarChart3,
  Stethoscope,
  Settings,
} from "lucide-react";
import { 
  springGentle, 
  hoverLiftEffect,
} from "@/lib/animations";

const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description:
      "Vista de día, semana y mes. Arrastra y suelta citas. Recordatorios automáticos por WhatsApp.",
  },
  {
    icon: Users,
    title: "Ficha del Paciente",
    description:
      "Historial completo, odontograma interactivo, fotografías, radiografías y documentos.",
  },
  {
    icon: Stethoscope,
    title: "Catálogo de Tratamientos",
    description:
      "Gestiona precios, duraciones y categorías. Vincula tratamientos a presupuestos automáticamente.",
  },
  {
    icon: FileText,
    title: "Presupuestos Profesionales",
    description:
      "Genera presupuestos en segundos. Envía por WhatsApp o email. Seguimiento de aprobaciones.",
  },
  {
    icon: CreditCard,
    title: "Control de Pagos",
    description:
      "Registro de pagos, pagos parciales, integración con Stripe y MercadoPago.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Business",
    description:
      "Confirmaciones automáticas, recordatorios de citas, mensajes masivos y chatbot.",
  },
  {
    icon: BarChart3,
    title: "Reportes y Estadísticas",
    description:
      "Dashboard con métricas clave, ingresos, citas del día, pacientes nuevos y más.",
  },
  {
    icon: Settings,
    title: "Multi-Usuario y Roles",
    description:
      "Administradores, dentistas, asistentes. Control de permisos granular por rol.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springGentle,
  },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={springGentle}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Todo lo que necesitas para gestionar tu clínica
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Herramientas diseñadas por dentistas, para dentistas. Simple, potente y accesible.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={hoverLiftEffect}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-lg hover:border-primary/50 transition-all group cursor-pointer"
            >
              <motion.div 
                className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={springGentle}
              >
                <feature.icon className="h-6 w-6 text-primary" />
              </motion.div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
