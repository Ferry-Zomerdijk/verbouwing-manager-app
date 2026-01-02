import { motion } from "framer-motion";
import { UserPlus, FolderPlus, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "1",
    title: "Maak een Account",
    description:
      "Registreer gratis in minder dan een minuut. Geen creditcard nodig.",
  },
  {
    icon: FolderPlus,
    step: "2",
    title: "Voeg je Project toe",
    description:
      "Maak je eerste project aan en voeg basisgegevens zoals budget en planning toe.",
  },
  {
    icon: Rocket,
    step: "3",
    title: "Begin met Plannen",
    description:
      "Voeg taken toe, upload documenten en nodig teamleden uit. Klaar om te starten!",
  },
];

export const LandingHowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Hoe het werkt
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            In 3 simpele stappen van start
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Geen technische kennis nodig. Begin vandaag nog met het beheren van je verbouwing.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20" />
              )}

              <div className="relative bg-card border rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                {/* Step number badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="w-8 h-8 rounded-full gradient-primary text-white font-bold flex items-center justify-center text-sm shadow-lg">
                    {step.step}
                  </div>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mt-4 mb-6">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
