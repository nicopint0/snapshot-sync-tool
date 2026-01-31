import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Dra. María González",
    role: "Odontóloga General",
    clinic: "Dental Care México",
    avatar: "",
    content:
      "Denty.io transformó mi consultorio. Antes pasaba horas organizando citas, ahora todo es automático. Mis pacientes reciben recordatorios por WhatsApp y casi no tengo cancelaciones.",
    rating: 5,
  },
  {
    name: "Dr. Carlos Mendoza",
    role: "Ortodoncista",
    clinic: "Ortodoncia Especializada",
    avatar: "",
    content:
      "El odontograma digital es increíble. Puedo mostrar a mis pacientes exactamente qué tratamiento necesitan y generar el presupuesto en segundos. ¡Mis cierres de venta mejoraron un 40%!",
    rating: 5,
  },
  {
    name: "Dra. Ana Rodríguez",
    role: "Endodoncista",
    clinic: "Centro Dental Premium",
    avatar: "",
    content:
      "Llevamos 6 meses usando Denty.io y la diferencia es notable. El equipo de soporte responde rápido y siempre están mejorando el software. 100% recomendado.",
    rating: 5,
  },
  {
    name: "Dr. Roberto Sánchez",
    role: "Director Clínico",
    clinic: "Dental Group Colombia",
    avatar: "",
    content:
      "Tenemos 3 sucursales y Denty.io nos permite gestionar todo desde un solo lugar. Los reportes financieros me ahorran horas de trabajo cada semana.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-lg text-muted-foreground">
              Más de 500 clínicas confían en Denty.io
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground mb-6 line-clamp-4">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={testimonial.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {testimonial.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.clinic}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
