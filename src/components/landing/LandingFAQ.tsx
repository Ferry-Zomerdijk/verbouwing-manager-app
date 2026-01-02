import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is De Renovatie App echt gratis te gebruiken?",
    answer:
      "Ja! Je kunt gratis starten met 1 project en basis functionaliteit. Geen creditcard nodig. Wanneer je meer projecten of geavanceerde functies nodig hebt, kun je upgraden naar een betaald plan.",
  },
  {
    question: "Kan ik de app gebruiken voor meerdere projecten?",
    answer:
      "Met het gratis plan kun je 1 project beheren. Het Basis plan biedt ruimte voor 3 projecten, en met Pro heb je onbeperkte projecten. Perfect voor ZZP'ers die meerdere klussen tegelijk doen.",
  },
  {
    question: "Hoe deel ik mijn project met anderen?",
    answer:
      "Je kunt teamleden uitnodigen via e-mail om samen aan een project te werken. Daarnaast kun je een publieke link genereren om de voortgang te delen met familie of opdrachtgevers, zonder dat zij een account nodig hebben.",
  },
  {
    question: "Zijn mijn gegevens veilig?",
    answer:
      "Absoluut. We gebruiken versleutelde verbindingen en veilige servers. Je documenten en foto's worden beveiligd opgeslagen. Je behoudt altijd de volledige controle over je eigen data.",
  },
  {
    question: "Kan ik mijn data exporteren?",
    answer:
      "Ja, met de Pro versie kun je je taken en projectdata exporteren naar Excel. Handig voor je administratie of om te delen met je boekhouder.",
  },
  {
    question: "Werkt de app op mijn telefoon?",
    answer:
      "De Renovatie App is volledig responsive en werkt op je computer, tablet en smartphone. Neem foto's op de bouwplaats en bekijk je planning onderweg.",
  },
  {
    question: "Kan ik mijn abonnement op elk moment opzeggen?",
    answer:
      "Ja, je kunt je abonnement op elk moment opzeggen. Je behoudt toegang tot de betaalde functies tot het einde van je factureringsperiode.",
  },
];

export const LandingFAQ = () => {
  return (
    <section id="faq" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Veelgestelde vragen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Heb je nog vragen? Hier vind je de antwoorden.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border rounded-xl px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-medium py-5 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
