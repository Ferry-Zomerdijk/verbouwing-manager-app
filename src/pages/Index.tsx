import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import {
  LandingHeader,
  LandingHero,
  LandingProblemSolution,
  LandingFeatures,
  LandingAiFeatures,
  LandingHowItWorks,
  LandingBenefits,
  LandingTestimonials,
  LandingPricingPreview,
  LandingFAQ,
  LandingCTA,
  LandingContact,
} from "@/components/landing";

const faqs = [
  ["Is De Renovatie App echt gratis te gebruiken?", "Ja! Je kunt gratis starten met 1 project en basis functionaliteit. Geen creditcard nodig. Wanneer je meer projecten of geavanceerde functies nodig hebt, kun je upgraden naar een betaald plan."],
  ["Kan ik de app gebruiken voor meerdere projecten?", "Met het gratis plan kun je 1 project beheren. Het Basis plan biedt ruimte voor 3 projecten, en met Pro heb je onbeperkte projecten."],
  ["Hoe deel ik mijn project met anderen?", "Je kunt teamleden uitnodigen via e-mail om samen aan een project te werken. Daarnaast kun je een publieke link genereren om de voortgang te delen."],
  ["Zijn mijn gegevens veilig?", "Absoluut. We gebruiken versleutelde verbindingen en veilige servers. Je documenten en foto's worden beveiligd opgeslagen."],
  ["Kan ik mijn data exporteren?", "Ja, met de Pro versie kun je je taken en projectdata exporteren naar Excel."],
  ["Werkt de app op mijn telefoon?", "De Renovatie App is volledig responsive en werkt op je computer, tablet en smartphone."],
  ["Kan ik mijn abonnement op elk moment opzeggen?", "Ja, je kunt je abonnement op elk moment opzeggen. Je behoudt toegang tot de betaalde functies tot het einde van je factureringsperiode."],
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "De Renovatie App",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  offers: [
    { "@type": "Offer", name: "Gratis", price: "0", priceCurrency: "EUR" },
    { "@type": "Offer", name: "Basis", price: "4.99", priceCurrency: "EUR" },
    { "@type": "Offer", name: "Pro", price: "9.99", priceCurrency: "EUR" },
  ],
};

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="De Renovatie App — Beheer je woningverbouwingen"
        description="Professioneel platform voor het plannen, volgen en beheren van woningverbouwingen met budgetten, taken, documenten en rapportage."
        path="/"
        jsonLd={[faqSchema, softwareSchema]}
      />
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingProblemSolution />
        <LandingFeatures />
        <LandingAiFeatures />
        <LandingHowItWorks />
        <LandingBenefits />
        <LandingTestimonials />
        <LandingPricingPreview />
        <LandingFAQ />
        <LandingContact />
        <LandingCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
