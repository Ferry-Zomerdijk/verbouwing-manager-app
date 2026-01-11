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

  // Calculate max height based on viewport
  const maxHeight = isKeyboardOpen 
    ? `${viewportHeight - 20}px` 
    : '90vh';

  return (
    <DrawerContent
      ref={ref}
      className={cn(
        "drawer-content-ios",
        className
      )}
      style={{ 
        maxHeight,
        ...style 
      }}
      {...props}
    >
      <div className="overflow-y-auto flex-1 overscroll-contain">
        {children}
      </div>
    </DrawerContent>
  );
});

KeyboardAwareDrawerContent.displayName = "KeyboardAwareDrawerContent";
