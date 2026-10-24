import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Gratis",
    price: "€0",
    description: "Perfect om te starten",
    features: ["1 project", "Basis takenbeheer", "Foto uploads"],
    popular: false,
  },
  {
    name: "Basis",
    price: "€4,99",
    period: "/maand",
    description: "Voor actieve verbouwers",
    features: [
      "3 projecten",
      "Uitgebreid takenbeheer",
      "Document opslag",
      "Aannemers beheer",
      "Email ondersteuning",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "€9,99",
    period: "/maand",
    description: "Voor professionals",
    features: [
      "Onbeperkte projecten",
      "Team samenwerking",
      "Publieke links",
      "Export functionaliteit",
      "Onbeperkte AI scans",
    ],
    popular: false,
  },
];

export const LandingPricingPreview = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Prijzen
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Een plan voor elke verbouwer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Begin gratis en upgrade wanneer je meer nodig hebt.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-card border rounded-2xl p-6 md:p-8 ${
                plan.popular
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Populair
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-semibold text-xl mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate("/auth")}
                variant={plan.popular ? "default" : "outline"}
                className={`w-full ${plan.popular ? "gradient-primary" : ""}`}
              >
                {plan.price === "€0" ? "Gratis Starten" : "Kies Plan"}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            className="text-primary hover:text-primary"
          >
            Bekijk alle features en prijzen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
