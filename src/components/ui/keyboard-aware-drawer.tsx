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
  const { viewportHeight, viewportOffsetTop, isKeyboardOpen } = useVisualViewport();

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

  // Calculate height and position based on visual viewport
  const dynamicStyles: React.CSSProperties = isKeyboardOpen
    ? {
        // Use the visual viewport height minus some padding
        height: `${viewportHeight - 10}px`,
        maxHeight: `${viewportHeight - 10}px`,
        // Position the drawer at the top of the visual viewport
        top: `${viewportOffsetTop}px`,
        bottom: 'auto',
        transform: 'none',
    }
    : {
        height: '95dvh',
        maxHeight: '95dvh',
      };

  return (
    <DrawerContent
      ref={ref}
      className={cn(
        "drawer-content-ios flex flex-col",
        isKeyboardOpen && "!fixed !inset-x-0",
        className
      )}
      style={{ 
        ...dynamicStyles,
        ...style 
      }}
      {...props}
    >
      {children}
    </DrawerContent>
  );
});

KeyboardAwareDrawerContent.displayName = "KeyboardAwareDrawerContent";
