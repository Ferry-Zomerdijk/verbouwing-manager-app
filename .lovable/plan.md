
# Plan: iPhone Toetsenbord-probleem bij Taak Toevoegen Oplossen

## Analyse van het Probleem

Op basis van de screenshots is het volgende zichtbaar:

| Screenshot | Observatie |
|------------|------------|
| **Lovable preview** | Header "Nieuwe taak" + stap-indicator + alle formuliervelden volledig zichtbaar |
| **iPhone (zonder toetsenbord)** | Bovenste deel (header met titel) is afgesneden - alleen de datum shortcuts en verantwoordelijken zichtbaar |
| **iPhone (met toetsenbord)** | Header is nog wel zichtbaar, maar content wordt naar boven geduwd |

### Oorzaak van het Probleem

Het probleem heeft **drie samenhangende oorzaken**:

1. **`visualViewport.height` positioning**: iOS Safari past de drawer niet correct aan aan de **top** van het viewport wanneer het toetsenbord opent. De huidige implementatie past alleen `maxHeight` aan, maar niet de **positie**.

2. **iOS Visual Viewport offset**: Wanneer het toetsenbord opent op iOS, verandert `visualViewport.offsetTop` - dit moet worden meegenomen in de positioning van de drawer.

3. **Conflict met native `position: fixed`**: De drawer is `fixed` aan de onderkant, maar iOS Safari behandelt het visual viewport anders, waardoor de drawer naar boven wordt "geduwd" buiten het zichtbare gebied.

### Technisch Bewijs
```typescript
// Huidige implementatie - past alleen hoogte aan, niet positie:
const maxHeight = isKeyboardOpen 
  ? `${viewportHeight - 20}px` 
  : '95dvh';
```

De `visualViewport.offsetTop` wordt niet gebruikt, waardoor de drawer de offset mist die nodig is om correct uitgelijnd te blijven.

---

## Oplossing

### Strategie
We passen de `KeyboardAwareDrawerContent` component aan om ook de **positie** van de drawer dynamisch aan te passen op basis van de `visualViewport.offsetTop` waarde, en voegen een safe area padding toe aan de bovenkant.

---

## Technische Wijzigingen

### Bestand 1: `src/hooks/useVisualViewport.tsx`

**Toevoegen van `offsetTop` tracking:**

```typescript
import { useState, useEffect } from 'react';

export function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  const [viewportOffsetTop, setViewportOffsetTop] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = viewport.height;
      setViewportHeight(currentHeight);
      setViewportOffsetTop(viewport.offsetTop);
      // Keyboard is open if viewport height is significantly smaller than initial
      setIsKeyboardOpen(currentHeight < initialHeight * 0.75);
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
    
    // Initial check
    handleResize();

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return { viewportHeight, viewportOffsetTop, isKeyboardOpen };
}
```

---

### Bestand 2: `src/components/ui/keyboard-aware-drawer.tsx`

**Aanpassen van positionering wanneer toetsenbord open is:**

```typescript
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
        // Gebruik de visual viewport hoogte minus wat padding
        height: `${viewportHeight - 10}px`,
        maxHeight: `${viewportHeight - 10}px`,
        // Positioneer de drawer op de top van het visual viewport
        top: `${viewportOffsetTop}px`,
        bottom: 'auto',
        transform: 'none',
      }
    : {
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
```

---

### Bestand 3: `src/index.css`

**Toevoegen van extra iOS keyboard fixes:**

```css
/* iOS Virtual Keyboard fixes - enhanced */
@supports (-webkit-touch-callout: none) {
  /* Existing rules... */
  
  /* Fix drawer positioning when keyboard is open */
  .drawer-content-ios.keyboard-open {
    position: fixed !important;
    transition: all 0.25s ease-out;
  }
  
  /* Prevent content from scrolling behind drawer */
  .drawer-content-ios input:focus,
  .drawer-content-ios textarea:focus {
    position: relative;
    z-index: 10;
  }
}
```

---

### Bestand 4: `src/components/project/MobileTaskWizard.tsx`

**Toevoegen van padding-top voor safe area op de scrollable content:**

In het scrollable content area rond regel 362:

```typescript
{/* Scrollable content */}
<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2 pt-safe">
```

En we voegen een CSS utility class toe voor `pt-safe` of gebruiken inline style met `env(safe-area-inset-top)`.

---

## Visueel Resultaat

```text
VOOR (iPhone):                    NA (iPhone):
┌──────────────────────┐          ┌──────────────────────┐
│ (Afgesneden header)  │          │ ← Nieuwe taak        │
│                      │          │   Stap 2 van 3       │
│ Vandaag   +1 week    │          │   ● ━━ ○             │
│                      │          │                      │
│ Wie is verantw...?   │          │ Wanneer?             │
│ [Arjan] [Bouwteam]   │          │ Startdatum           │
│                      │          │ [📅 dd-mm-jjjj    ]  │
├──────────────────────┤          │ Vandaag   +1 week    │
│ [Annuleren][Volgende]│          │                      │
├──────────────────────┤          │ Wie is verantw...?   │
│   ┌─────────────┐    │          ├──────────────────────┤
│   │  TOETSENBORD│    │          │ [Annuleren][Volgende]│
│   └─────────────┘    │          ├──────────────────────┤
└──────────────────────┘          │   ┌─────────────┐    │
                                  │   │  TOETSENBORD│    │
                                  │   └─────────────┘    │
                                  └──────────────────────┘
```

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/hooks/useVisualViewport.tsx` | Toevoegen `viewportOffsetTop` tracking |
| `src/components/ui/keyboard-aware-drawer.tsx` | Dynamische positie + hoogte op basis van visual viewport |
| `src/index.css` | Extra iOS-specifieke CSS fixes voor drawer positioning |
| `src/components/project/MobileTaskWizard.tsx` | Safe area padding toevoegen aan scrollable content |

---

## Belangrijke Overwegingen

- De fix is **iOS-specifiek** door gebruik van `@supports (-webkit-touch-callout: none)`
- Android scrolling blijft ongewijzigd (werkte al correct)
- De `visualViewport` API is breed ondersteund in moderne browsers (iOS Safari 13+)
- Fallback naar standaard gedrag wanneer `visualViewport` niet beschikbaar is
