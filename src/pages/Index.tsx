import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";
import heroHouse from "@/assets/hero-house.png";

const Index = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Parallax Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
          willChange: 'transform',
        }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroHouse})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-3xl gradient-primary flex items-center justify-center shadow-hover">
            <Home className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary-dark to-primary bg-clip-text text-transparent">
            HomeProject
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 px-4">
            Beheer je woningverbouwingen professioneel.<br className="hidden sm:block" />
            <span className="block sm:inline"> Plan, volg en controleer je renovatieprojecten op één plek.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button 
              onClick={() => navigate("/auth")} 
              size="lg" 
              className="gradient-primary text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
            >
              Aan de slag
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
