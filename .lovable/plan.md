
# Plan: Fix doorklikken naar achterstallige leveringen

## Probleem

Wanneer je op een levering klikt in de "Aankomende leveringen" widget, navigeert de app naar `/project/{id}?task={taskId}`. Echter:

1. De Tabs component opent standaard op "overzicht" (`defaultValue="overzicht"`)
2. De `?task=` parameter wordt verwerkt in `ProjectTasksWithDnd` 
3. Dit component is alleen gemount wanneer de "taken" tab actief is
4. Resultaat: de taak-dialog opent nooit

Dit verklaart waarom klikken op achterstallige leveringen niet werkt - de code om de taak te openen draait simpelweg niet.

---

## Oplossing

In `ProjectDetail.tsx` de `?task=` parameter uitlezen en de tabs automatisch laten starten op "taken" wanneer deze aanwezig is.

---

## Technische wijzigingen

### ProjectDetail.tsx

```typescript
// Imports toevoegen
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

// In de component
const [searchParams] = useSearchParams();

// Bepaal initiële tab op basis van URL parameter
const initialTab = searchParams.get('task') ? 'taken' : 'overzicht';

// Tabs component aanpassen
<Tabs defaultValue={initialTab} className="w-full">
```

---

## Wijzigingen samengevat

| Locatie | Wijziging |
|---------|-----------|
| `src/pages/ProjectDetail.tsx` | `useSearchParams` hook toevoegen |
| `src/pages/ProjectDetail.tsx` | `initialTab` logica toevoegen |
| `src/pages/ProjectDetail.tsx` | `defaultValue={initialTab}` in Tabs |

---

## Resultaat

- Klik op een levering → navigeert naar project met `?task=` parameter
- `ProjectDetail` detecteert de parameter en opent direct de "taken" tab
- `ProjectTasksWithDnd` mount en verwerkt de `?task=` parameter
- `EditTaskDialog` opent automatisch met de juiste taak

Dit werkt voor zowel reguliere als achterstallige leveringen in beide widgets (Dashboard en Project-overzicht).
