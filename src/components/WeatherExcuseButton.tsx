import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRandomExcuse } from "@/lib/builderJokes";

const WeatherExcuseButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [excuse, setExcuse] = useState("");
  const [clickCount, setClickCount] = useState(0);

  const generateExcuse = () => {
    setExcuse(getRandomExcuse());
    setDialogOpen(true);
    setClickCount(prev => prev + 1);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={generateExcuse}
        className="text-muted-foreground hover:text-foreground"
        title="Weer-excuus generator"
      >
        <Cloud className="w-4 h-4" />
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Officieel Weer-Excuus™
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <p className="text-xl font-medium">{excuse}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Excuus #{clickCount} • Gebruik met mate 😉
            </p>
            <Button 
              onClick={() => setExcuse(getRandomExcuse())} 
              variant="outline" 
              className="w-full"
            >
              Nieuw excuus genereren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WeatherExcuseButton;
