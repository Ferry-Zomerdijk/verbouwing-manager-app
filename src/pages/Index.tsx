import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl gradient-primary flex items-center justify-center shadow-hover">
          <Home className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-dark to-primary bg-clip-text text-transparent">
          HomeProject
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8">
          Beheer je woningverbouwingen professioneel.<br />
          Plan, volg en controleer je renovatieprojecten op één plek.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate("/auth")} size="lg" className="gradient-primary text-lg px-8">
            Aan de slag
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
