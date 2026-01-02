import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import {
  LandingHeader,
  LandingHero,
  LandingProblemSolution,
  LandingFeatures,
  LandingHowItWorks,
  LandingBenefits,
  LandingTestimonials,
  LandingPricingPreview,
  LandingFAQ,
  LandingCTA,
} from "@/components/landing";

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
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingProblemSolution />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingBenefits />
        <LandingTestimonials />
        <LandingPricingPreview />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
