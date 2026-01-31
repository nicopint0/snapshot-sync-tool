import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "¿Cuánto tiempo tarda la configuración inicial?",
    answer:
      "Menos de 10 minutos. Solo necesitas crear tu cuenta, agregar los datos de tu clínica y ya puedes empezar a agendar citas. Nuestro asistente te guía paso a paso.",
  },
  {
    question: "¿Puedo importar mis pacientes existentes?",
    answer:
      "Sí, puedes importar pacientes desde Excel o CSV. También ofrecemos migración asistida desde otros sistemas de gestión dental de forma gratuita en planes Professional y superiores.",
  },
  {
    question: "¿La integración con WhatsApp tiene costo adicional?",
    answer:
      "No. La integración con WhatsApp Business está incluida en todos los planes. Solo necesitas una cuenta de WhatsApp Business API (Meta cobra ~$0.05 USD por conversación).",
  },
  {
    question: "¿Mis datos están seguros?",
    answer:
      "Absolutamente. Usamos encriptación de grado bancario (AES-256), servidores certificados SOC 2, y cumplimos con regulaciones de protección de datos médicos. Tus datos nunca se comparten con terceros.",
  },
  {
    question: "¿Puedo cancelar en cualquier momento?",
    answer:
      "Sí, puedes cancelar tu suscripción cuando quieras desde tu panel de configuración. No hay contratos a largo plazo ni penalizaciones por cancelación.",
  },
  {
    question: "¿Ofrecen soporte en español?",
    answer:
      "¡Por supuesto! Todo nuestro equipo de soporte habla español nativo. Respondemos en menos de 2 horas en horario laboral (lunes a viernes 9am-6pm hora México).",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-muted-foreground">
              ¿Tienes dudas? Aquí las respondemos
            </p>
          </motion.div>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="border-b border-border"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full py-5 text-left"
              >
                <span className="font-medium text-foreground pr-8">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform shrink-0",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-muted-foreground">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
