
# Plan: Drawer Altijd Schermvullend Maken op iPhone (Zonder Toetsenbord)

## Probleem Analyse

Op basis van de screenshot is het volgende zichtbaar:
- De "Nieuwe taak" drawer toont slechts ~50% van het scherm op iPhone
- De Lovable preview toont het correct als schermvullend (95dvh)
- Dit gebeurt wanneer het toetsenbord **niet** actief is

### Technische Oorzaak

De huidige `KeyboardAwareDrawerContent` implementatie:

```typescript
const dynamicStyles: React.CSSProperties = isKeyboardOpen
  ? {
      height: `${viewportHeight - 10}px`,
      maxHeight: `${viewportHeight - 10}px`,
      top: `${viewportOffsetTop}px`,
      bottom: 'auto',
      transform: 'none',
    }
  : {
      maxHeight: '95dvh',  // ❌ Alleen maxHeight, geen expliciete height!
    };
```

**Het probleem**: Wanneer `isKeyboardOpen = false`, wordt alleen `maxHeight` gezet maar **niet** `height`. De vaul drawer library heeft intern `h-auto` als default, wat betekent dat de drawer alleen zo groot wordt als de content nodig heeft - niet de volledige 95dvh.

Hoewel er `className="h-[95dvh]"` staat op de component in MobileTaskWizard.tsx, wordt dit overschreven door de inline `style` prop die geen `height` bevat.

---

## Oplossing

### Strategie
Voeg een expliciete `height: '95dvh'` toe aan de `dynamicStyles` wanneer het toetsenbord niet open is, zodat de drawer altijd de volledige hoogte krijgt.

---

## Technische Wijzigingen

### Bestand: `src/components/ui/keyboard-aware-drawer.tsx`

**Wijziging in dynamicStyles (regel 33-46):**

Van:
```typescript
const dynamicStyles: React.CSSProperties = isKeyboardOpen
  ? {
      height: `${viewportHeight - 10}px`,
      maxHeight: `${viewportHeight - 10}px`,
      top: `${viewportOffsetTop}px`,
      bottom: 'auto',
      transform: 'none',
    }
  : {
      maxHeight: '95dvh',
    };
```

Naar:
```typescript
const dynamicStyles: React.CSSProperties = isKeyboardOpen
  ? {
      height: `${viewportHeight - 10}px`,
      maxHeight: `${viewportHeight - 10}px`,
      top: `${viewportOffsetTop}px`,
      bottom: 'auto',
      transform: 'none',
    }
  : {
      height: '95dvh',
      maxHeight: '95dvh',
    };
```

---

## Visueel Resultaat

```text
VOOR (iPhone zonder toetsenbord):     NA (iPhone zonder toetsenbord):
┌──────────────────────┐              ┌──────────────────────┐
│                      │              │ ← Nieuwe taak        │
│  (Takenlijst         │              │   Stap 1 van 3       │
│   zichtbaar)         │              │   ● ○ ○              │
│                      │              │                      │
├──────────────────────┤              │ Titel *              │
│ Nieuwe taak          │              │ [Wat moet er...]     │
│ Stap 1 van 3: Titel  │              │                      │
│ ● ○ ○                │              │ Beschrijving (opt)   │
│                      │              │ [Extra details...]   │
│ Titel *              │              │                      │
│ [Wat moet er...]     │              │                      │
│                      │              │                      │
│ Beschrijving (opt)   │              │                      │
│ [Extra deta...]      │              ├──────────────────────┤
├──────────────────────┤              │ [Annuleren][Volgende]│
│ [Annuleren][Volgende]│              └──────────────────────┘
└──────────────────────┘
        (~50% scherm)                        (~95% scherm)
```

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/ui/keyboard-aware-drawer.tsx` | Toevoegen van `height: '95dvh'` aan de non-keyboard state |

---

## Alternatieve Overwegingen

Indien de oplossing niet werkt vanwege iOS Safari specifieke problemen met `dvh` units, kunnen we als fallback:

1. Een CSS class `.drawer-fullscreen-ios` toevoegen met `!important` rules
2. Of JavaScript gebruiken om `window.innerHeight` te berekenen en als fallback te gebruiken

Maar de voorgestelde oplossing zou in de meeste moderne iOS browsers (Safari 15.4+) moeten werken aangezien `dvh` goed ondersteund is.
