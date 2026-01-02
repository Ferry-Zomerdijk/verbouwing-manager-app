import { motion } from "framer-motion";
import { Briefcase, Home, CheckCircle } from "lucide-react";

const zzpBenefits = [
  "Kom professioneel over bij je klanten",
  "Beheer meerdere projecten tegelijk",
  "Houd kosten altijd up-to-date",
  "Deel voortgang eenvoudig met opdrachtgevers",
  "Exporteer rapporten voor je administratie",
];

const particulierBenefits = [
  "Nooit meer overzicht kwijtraken",
  "Alles op één centrale plek",
  "Deel voortgang met familie en vrienden",
  "Vergelijk offertes van aannemers",
  "Bewaar alle documenten veilig",
];

export const LandingBenefits = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Voor iedereen
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Of je nu ZZP'er bent of particulier
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            De Renovatie App is ontworpen voor iedereen die een verbouwingsproject wil beheren.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* ZZP'ers */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Voor ZZP'ers</h3>
                <p className="text-sm text-muted-foreground">
                  Bouw- en renovatieprofessionals
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {zzpBenefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Particulieren */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
                <Home className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Voor Particulieren</h3>
                <p className="text-sm text-muted-foreground">
                  Huiseigenaren en verbouwers
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {particulierBenefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
