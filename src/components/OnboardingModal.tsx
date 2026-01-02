import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Home, 
  ClipboardList, 
  Euro, 
  Users, 
  Share2, 
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
    title: "Projecten Aanmaken",
    description: "Begin met het aanmaken van je eerste renovatieproject. Voeg details toe zoals budget, planning en beschrijving.",
    icon: Home,
    tips: [
      "Klik op 'Nieuw Project' om te starten",
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

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Stap {currentStep + 1} van {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 text-primary" />
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Tips */}
          <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4">
            {currentStepData.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-foreground">{tip}</span>
              </div>
            ))}
          </div>
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
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                size="icon"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            
            <Button onClick={handleNext} className="min-w-[120px]">
              {isLastStep ? (
                <>
                  Aan de slag
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Volgende
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="pb-4 flex justify-center gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep 
                  ? "bg-primary" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Ga naar stap ${index + 1}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
