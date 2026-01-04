import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Share, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';

const SHOW_DELAY = 30000; // 30 seconds
const NAV_COUNT_KEY = 'pwa-nav-count';
const NAV_THRESHOLD = 2;

export function PwaInstallPrompt() {
  const { canInstall, isIOS, promptInstall, dismissPrompt, canPromptNatively } = usePwaInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (!canInstall) return;

    // Track navigation count
    const navCount = parseInt(localStorage.getItem(NAV_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(NAV_COUNT_KEY, navCount.toString());

    // Show after delay or nav threshold
    if (navCount >= NAV_THRESHOLD) {
      setShowPrompt(true);
    } else {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, SHOW_DELAY);
      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const success = await promptInstall();
      if (success) {
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  const handleIOSClose = () => {
    setShowIOSInstructions(false);
    handleDismiss();
  };

  if (!canInstall || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showIOSInstructions ? (
        <motion.div
          key="ios-instructions"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Installeer op iPhone/iPad</span>
              </div>
              <button
                onClick={handleIOSClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                    1
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-foreground">Tik op het deel-icoon</span>
                    <Share className="h-5 w-5 text-primary" />
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                    2
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-foreground">Scroll en kies</span>
                    <span className="font-medium text-primary">"Zet op beginscherm"</span>
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                    3
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-foreground">Tik op</span>
                    <span className="font-medium text-primary">"Voeg toe"</span>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleIOSClose} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Begrepen
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="install-prompt"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-xl">🏠</span>
                </div>
                <span className="font-semibold text-foreground">De Renovatie App</span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-foreground font-medium">
                Installeer de app voor de beste ervaring!
              </p>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Werkt offline</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Snelle toegang vanaf je startscherm</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Volledige schermervaring</span>
                </li>
              </ul>
              
              <div className="flex gap-2">
                <Button onClick={handleInstall} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Installeren
                </Button>
                <Button variant="outline" onClick={handleDismiss} className="flex-1">
                  Later
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
