import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Mark de Vries",
    role: "ZZP Aannemer",
    content:
      "Eindelijk een app die begrijpt wat ik nodig heb. Mijn klanten zijn onder de indruk van de professionele voortgangsrapportages.",
    rating: 5,
  },
  {
    name: "Sophie Jansen",
    role: "Huiseigenaar",
    content:
      "Onze keukenverbouwing liep soepel dankzij De Renovatie App. Alles op één plek, van offertes tot foto's. Aanrader!",
    rating: 5,
  },
  {
    name: "Peter Bakker",
    role: "Bouwkundig Adviseur",
    content:
      "Ik gebruik de app voor al mijn projecten. De samenwerking met opdrachtgevers is nog nooit zo makkelijk geweest.",
    rating: 5,
  },
];

export const LandingTestimonials = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Ervaringen
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Wat onze gebruikers zeggen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ontdek hoe anderen hun verbouwingsprojecten succesvol beheren.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border rounded-2xl p-6 md:p-8 relative hover:shadow-lg transition-shadow"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6 text-primary/20">
                <Quote className="w-10 h-10" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground/80 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
