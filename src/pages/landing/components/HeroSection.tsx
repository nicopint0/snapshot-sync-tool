import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users, MessageCircle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  springSubtle, 
  springGentle,
  staggerContainerVariants,
  fadeUpVariants,
  hoverLiftEffect,
} from "@/lib/animations";

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
};

const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span 
              variants={heroItemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Brain className="h-4 w-4" />
              Potenciado con Inteligencia Artificial
            </motion.span>
            
            <motion.h1 
              variants={heroItemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
            >
              Tu clínica dental,{" "}
              <span className="text-primary">más inteligente</span>
            </motion.h1>
            
            <motion.p 
              variants={heroItemVariants}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Denty.io es el software de gestión dental que automatiza tu consultorio, 
              simplifica la agenda y mejora la comunicación con tus pacientes.
            </motion.p>

            <motion.div 
              variants={heroItemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, transition: springSubtle }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="lg" className="text-base px-8" asChild>
                  <Link to="/auth/register">
                    Comenzar Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03, transition: springSubtle }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="lg" variant="outline" className="text-base px-8" asChild>
                  <a href="#demo">Ver Demo</a>
                </Button>
              </motion.div>
            </motion.div>

            <motion.p 
              variants={heroItemVariants}
              className="text-sm text-muted-foreground mt-4"
            >
              14 días gratis • Sin tarjeta de crédito • Cancela cuando quieras
            </motion.p>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            {[
              { icon: Calendar, label: "Agenda inteligente" },
              { icon: Users, label: "Gestión de pacientes" },
              { icon: MessageCircle, label: "WhatsApp integrado" },
              { icon: Brain, label: "Asistente IA" },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeUpVariants}
                whileHover={hoverLiftEffect}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
