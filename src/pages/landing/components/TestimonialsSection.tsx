import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const testimonials = [
  {
    name: "Dra. María González",
    role: "Odontóloga General",
    clinic: "Consultorio Dental María",
    plan: "Individual",
    avatar: "",
    content:
      "Con el Plan Individual tengo todo lo que necesito para mi consultorio. La agenda automática y los recordatorios por WhatsApp han reducido mis cancelaciones en un 80%.",
    rating: 5,
  },
  {
    name: "Dr. Carlos Mendoza",
    role: "Director Clínico",
    clinic: "Clínica Dental Sonrisa",
    plan: "Profesional",
    avatar: "",
    content:
      "Pasamos al Plan Profesional cuando crecimos a 4 dentistas. Tener un administrativo dedicado y el soporte prioritario ha sido clave para nuestra operación diaria.",
    rating: 5,
  },
  {
    name: "Dra. Ana Rodríguez",
    role: "Endodoncista",
    clinic: "Centro Dental Premium",
    plan: "Profesional",
    avatar: "",
    content:
      "Los reportes avanzados del Plan Profesional me permiten ver exactamente qué tratamientos generan más ingresos. Mis cierres de venta mejoraron un 40%.",
    rating: 5,
  },
  {
    name: "Dr. Roberto Sánchez",
    role: "CEO",
    clinic: "Dental Group Chile",
    plan: "Business",
    avatar: "",
    content:
      "Con 3 sucursales y 15 profesionales, el Plan Business es perfecto. El onboarding dedicado nos tuvo operativos en una semana y el soporte 24/7 es excepcional.",
    rating: 5,
  },
];

const getPlanColor = (plan: string) => {
  switch (plan) {
    case "Individual":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "Profesional":
      return "bg-primary/10 text-primary border-primary/20";
    case "Business":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    default:
      return "bg-muted";
  }
};

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Badge variant="outline" className={getPlanColor(testimonial.plan)}>
                  {testimonial.plan}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6 line-clamp-5">
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
