import { motion } from "framer-motion";
import { Sparkles, ScanText, Brain, Zap, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const aiFeatures = [
  {
    icon: ScanText,
    title: "Automatische Factuurherkenning",
    description:
      "Upload een factuur en laat AI automatisch de leverancier, bedrag, datum en categorie herkennen.",
  },
  {
    icon: Brain,
    title: "Slimme Categorisatie",
    description:
      "AI herkent kostensoorten en wijst automatisch de juiste categorie toe aan je uitgaven.",
  },
  {
    icon: Zap,
    title: "Directe Verwerking",
    description:
      "Geen handmatig overtypen meer. Scan je factuur en de gegevens staan direct in je project.",
  },
  {
    icon: TrendingUp,
    title: "Kostenbesparing",
    description:
      "Bespaar tijd en voorkom fouten door automatische data-extractie uit je documenten.",
  },
];

export const LandingAiFeatures = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4 gap-2">
            <Sparkles className="w-3 h-3" />
            AI-Powered
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Slimme AI Factuurscanning
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Laat kunstmatige intelligentie het zware werk doen. Upload je facturen 
            en wij herkennen automatisch alle belangrijke gegevens.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {aiFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 hover:shadow-xl hover:border-primary/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demo/CTA section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-4">
            Probeer AI Factuurscanning
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Basis gebruikers krijgen 10 AI scans per maand. Pro gebruikers hebben 
            onbeperkt toegang tot alle AI functies. Bespaar uren werk per maand!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Start Gratis
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}>
              Bekijk Prijzen
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
