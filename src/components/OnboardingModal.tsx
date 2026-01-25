import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Home, 
  ClipboardList, 
  Users, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Check
} from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    id: "welcome",
    title: "Welkom bij De Renovatie App!",
    description: "Jouw persoonlijke assistent voor het beheren van renovatieprojecten. In enkele stappen laten we je zien hoe je alles uit de app haalt.",
    icon: Sparkles,
    tips: [
      "Overzichtelijk projectbeheer",
      "Taken en kosten bijhouden", 
      "Samenwerken met je team"
    ]
  },
  {
    id: "projects",
    title: "Projecten aanmaken",
    description: "Begin met het aanmaken van je eerste renovatieproject. Voeg details toe zoals budget, planning en beschrijving.",
    icon: Home,
    tips: [
      "Klik op 'Nieuw project' om te starten",
      "Stel een budget en planning in",
      "Volg de voortgang in één oogopslag"
    ]
  },
  {
    id: "tasks",
    title: "Taken & Kosten",
    description: "Beheer al je taken met een visueel Kanban-bord. Sleep taken tussen kolommen en houd je kosten bij.",
    icon: ClipboardList,
    tips: [
      "Drag & drop taken tussen statussen",
      "Voeg foto's en notities toe aan taken",
      "Registreer facturen en offertes"
    ]
  },
  {
    id: "team",
    title: "Team & Delen",
    description: "Nodig teamleden en aannemers uit om samen te werken. Deel de voortgang met een publieke link.",
    icon: Users,
    tips: [
      "Nodig mensen uit via e-mail",
      "Deel een publieke link met familie",
      "Werk samen in real-time"
    ]
  }
];

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

const iconVariants: Variants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
      delay: 0.1
    }
  },
  exit: { 
    scale: 0, 
    rotate: 180,
    transition: { duration: 0.2 }
  }
};

const tipVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.2 + i * 0.1,
      duration: 0.3,
      ease: "easeOut" as const
    }
  }),
};

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleStepClick = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onComplete(); }}>
      <DialogContent 
        className="sm:max-w-lg p-0 gap-0 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ originX: 0 }}
          >
            <Progress value={progress} className="h-2" />
          </motion.div>
          <motion.p 
            className="text-xs text-muted-foreground mt-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Stap {currentStep + 1} van {steps.length}
          </motion.p>
        </div>

        {/* Content with AnimatePresence for step transitions */}
        <div className="px-6 py-8 text-center overflow-hidden min-h-[320px] flex flex-col justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
            >
              {/* Icon */}
              <motion.div 
                className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                key={`icon-${currentStep}`}
              >
                <Icon className="w-8 h-8 text-primary" />
              </motion.div>

              {/* Title & Description */}
              <motion.h2 
                className="text-2xl font-bold text-foreground mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                {currentStepData.title}
              </motion.h2>
              <motion.p 
                className="text-muted-foreground mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {currentStepData.description}
              </motion.p>

              {/* Tips */}
              <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4">
                {currentStepData.tips.map((tip, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start gap-3"
                    variants={tipVariants}
                    initial="initial"
                    animate="animate"
                    custom={index}
                  >
                    <motion.div 
                      className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        delay: 0.3 + index * 0.1,
                        type: "spring",
                        stiffness: 300
                      }}
                    >
                      <Check className="w-3 h-3 text-primary" />
                    </motion.div>
                    <span className="text-sm text-foreground">{tip}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Overslaan
          </Button>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {!isFirstStep && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    size="icon"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button onClick={handleNext} className="min-w-[120px]">
                <AnimatePresence mode="wait">
                  {isLastStep ? (
                    <motion.span
                      key="finish"
                      className="flex items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Aan de slag
                      <Sparkles className="w-4 h-4 ml-2" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="next"
                      className="flex items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Volgende
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Step indicators */}
        <div className="pb-4 flex justify-center gap-2">
          {steps.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => handleStepClick(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep 
                  ? "bg-primary" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Ga naar stap ${index + 1}`}
              whileHover={{ scale: 1.5 }}
              whileTap={{ scale: 0.9 }}
              animate={index === currentStep ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
