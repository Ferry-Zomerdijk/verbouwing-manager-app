import { Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PwaInstallButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function PwaInstallButton({
  variant = "outline",
  size = "icon",
  showLabel = false,
  className,
}: PwaInstallButtonProps) {
  const navigate = useNavigate();
  const { canInstall, canPromptNatively, isInstalled, promptInstall, isIOS } = usePwaInstall();

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    // If we can prompt natively (Android/Desktop Chrome), try that first
    if (canPromptNatively) {
      const success = await promptInstall();
      if (success) return;
    }
    // Otherwise navigate to install page (for iOS or as fallback)
    navigate("/install");
  };

  if (showLabel) {
    return (
      <Button
        variant={variant}
        size={size === "icon" ? "sm" : size}
        onClick={handleClick}
        className={className}
      >
        <Download className="w-4 h-4 mr-2" />
        Installeer App
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          className={className}
        >
          <Download className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Installeer app op je telefoon</p>
      </TooltipContent>
    </Tooltip>
  );
}
