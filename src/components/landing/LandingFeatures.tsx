import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListTodo,
  Euro,
  Camera,
  Users,
  UserPlus,
  Share2,
  FileSpreadsheet,
  FolderOpen,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Projectbeheer",
    description:
      "Beheer meerdere verbouwingsprojecten tegelijk met een overzichtelijk dashboard.",
  },
  {
    icon: ListTodo,
    title: "Takenbeheer",
    description:
      "Plan taken, stel deadlines in en volg de voortgang met drag-and-drop functionaliteit.",
  },
  {
    icon: Euro,
    title: "Kostenoverzicht",
    description:
      "Houd je budget bij, categoriseer kosten en vergelijk schattingen met werkelijke uitgaven.",
  },
  {
    icon: Camera,
    title: "Foto Documentatie",
    description:
      "Leg de voor-, tijdens- en na-situatie vast met foto's per projectfase.",
  },
  {
    icon: FolderOpen,
    title: "Documenten Opslag",
    description:
      "Bewaar offertes, vergunningen, handleidingen en contracten op één veilige plek.",
  },
  {
    icon: Users,
    title: "Aannemers Beheer",
    description:
      "Houd contactgegevens, rollen en notities van al je aannemers bij de hand.",
  },
  {
    icon: UserPlus,
    title: "Team Samenwerking",
    description:
      "Nodig partners, aannemers of adviseurs uit om samen aan projecten te werken.",
  },
  {
    icon: Share2,
    title: "Publieke Links",
    description:
      "Deel de voortgang van je project met familie of vrienden via een beveiligde link.",
  },
  {
    icon: FileSpreadsheet,
    title: "Import & Export",
    description:
      "Importeer taken uit Excel of exporteer je projectdata voor eigen administratie.",
  },
  {
    icon: Bell,
    title: "Notificaties",
    description:
      "Ontvang meldingen over deadlines, budgetoverschrijdingen en nieuwe updates.",
  },
];

export const LandingFeatures = () => {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Functies
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Alles wat je nodig hebt voor je verbouwing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Van planning tot oplevering – De Renovatie App ondersteunt je bij elke stap.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="group bg-card border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
