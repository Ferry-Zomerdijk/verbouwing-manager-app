import * as React from "react";
import { DrawerContent } from "./drawer";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { cn } from "@/lib/utils";

interface KeyboardAwareDrawerContentProps 
  extends React.ComponentPropsWithoutRef<typeof DrawerContent> {
  children: React.ReactNode;
}

export const KeyboardAwareDrawerContent = React.forwardRef<
  HTMLDivElement,
  KeyboardAwareDrawerContentProps
>(({ className, children, style, ...props }, ref) => {
  const { viewportHeight, isKeyboardOpen } = useVisualViewport();

  // Scroll focused input into view when keyboard opens
  React.useEffect(() => {
    if (!isKeyboardOpen) return;
    
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLInputElement || 
        activeElement instanceof HTMLTextAreaElement) {
      setTimeout(() => {
        activeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [isKeyboardOpen]);

  // Calculate max height based on viewport - lower for Android compatibility
  const maxHeight = isKeyboardOpen 
    ? `${viewportHeight - 20}px` 
    : '85vh';

  return (
    <DrawerContent
      ref={ref}
      className={cn(
        "drawer-content-ios flex flex-col",
        className
      )}
      style={{ 
        maxHeight,
        ...style 
      }}
      {...props}
    >
      {children}
    </DrawerContent>
  );
});

KeyboardAwareDrawerContent.displayName = "KeyboardAwareDrawerContent";
