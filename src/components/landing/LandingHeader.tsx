import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Menu, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export const LandingHeader = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { canInstall, promptInstall, isIOS } = usePwaInstall();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block">De Renovatie App</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Functies
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Hoe het werkt
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Prijzen
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Contact
            </button>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {canInstall && (
              <Button variant="outline" size="sm" onClick={promptInstall}>
                <Download className="h-4 w-4 mr-2" />
                {isIOS ? 'Installeren' : 'App Installeren'}
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Inloggen
            </Button>
            <Button onClick={() => navigate("/auth")} className="gradient-primary">
              Gratis Starten
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("features")}
                className="text-left py-2 text-foreground/80 hover:text-foreground transition-colors font-medium"
              >
                Functies
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left py-2 text-foreground/80 hover:text-foreground transition-colors font-medium"
              >
                Hoe het werkt
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-left py-2 text-foreground/80 hover:text-foreground transition-colors font-medium"
              >
                Prijzen
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-left py-2 text-foreground/80 hover:text-foreground transition-colors font-medium"
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-left py-2 text-foreground/80 hover:text-foreground transition-colors font-medium"
              >
                Contact
              </button>
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
                  Inloggen
                </Button>
                <Button onClick={() => navigate("/auth")} className="w-full gradient-primary">
                  Gratis Starten
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
