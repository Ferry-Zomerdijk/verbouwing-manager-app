import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Smartphone,
  Wifi,
  Bell,
  Zap,
  CheckCircle2,
  Share,
  PlusSquare,
  ArrowLeft,
  Home,
} from "lucide-react";

const Install = () => {
  const navigate = useNavigate();
  const {
    canInstall,
    canPromptNatively,
    isInstalled,
    isIOS,
    promptInstall,
  } = usePwaInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (canPromptNatively) {
      await promptInstall();
    }
  };

  const benefits = [
    {
      icon: Zap,
      title: "Snellere toegang",
      description: "Open de app direct vanaf je startscherm, geen browser nodig",
    },
    {
      icon: Wifi,
      title: "Werkt offline",
      description: "Bekijk je projecten ook zonder internetverbinding",
    },
    {
      icon: Bell,
      title: "Push notificaties",
      description: "Blijf op de hoogte van updates en deadlines",
    },
    {
      icon: Smartphone,
      title: "Native ervaring",
      description: "Voelt aan als een echte app, volledig scherm",
    },
  ];

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">App al geïnstalleerd!</h1>
          <p className="text-muted-foreground mb-6">
            De Renovatie App staat al op je apparaat. Je kunt de app openen vanaf je startscherm.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="gradient-primary">
            <Home className="w-4 h-4 mr-2" />
            Naar Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">De Renovatie App</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {showIOSInstructions ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-6 text-center">
                  Installeren op iOS
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Share className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Stap 1: Tik op "Deel"</p>
                      <p className="text-sm text-muted-foreground">
                        Tik op het deel-icoon onderaan in Safari (vierkant met pijl omhoog)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <PlusSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Stap 2: "Zet op beginscherm"</p>
                      <p className="text-sm text-muted-foreground">
                        Scroll naar beneden en tik op "Zet op beginscherm"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Stap 3: Bevestig</p>
                      <p className="text-sm text-muted-foreground">
                        Tik op "Voeg toe" rechtsboven om te bevestigen
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => setShowIOSInstructions(false)}
                >
                  Terug
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Hero Section */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Home className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Installeer de App</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Installeer De Renovatie App op je telefoon voor snellere toegang en een betere ervaring.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <benefit.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">{benefit.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Install Button */}
            <div className="text-center space-y-4">
              {canInstall ? (
                <Button
                  onClick={handleInstall}
                  size="lg"
                  className="gradient-primary text-lg px-8 py-6"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Installeer Nu
                </Button>
              ) : !isInstalled && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {isIOS
                      ? "Open deze pagina in Safari om de app te installeren."
                      : "Je browser ondersteunt geen app installatie, of de app is al geïnstalleerd."}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Gratis • Geen app store nodig • Direct beschikbaar
              </p>
            </div>

            {/* Already have an account */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Al een account?
              </p>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Ga naar Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Install;
