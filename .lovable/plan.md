
# Plan: Sorteervoorkeuren Opslaan in localStorage

## Doel
De sorteervoorkeuren (primaire en secundaire sortering) bewaren in localStorage, zodat de gebruiker zijn gekozen sorteervolgorde behoudt wanneer hij de pagina herlaadt of later terugkomt.

---

## Technische Wijzigingen

### Bestand: `src/components/project/TaskListView.tsx`

### 1. localStorage Key Definiëren

Een unieke key per project zodat elk project zijn eigen sorteervoorkeuren kan hebben:

```typescript
const SORT_STORAGE_KEY = `task-sort-${projectId}`;
```

### 2. Initiële State Laden uit localStorage

Bij het laden van de component, de opgeslagen voorkeuren ophalen:

```typescript
const [primarySort, setPrimarySort] = useState<{ key: SortKey; direction: SortDirection } | null>(() => {
  if (!projectId) return null;
  try {
    const stored = localStorage.getItem(`task-sort-${projectId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.primary || null;
    }
  } catch {
    // Fallback bij parse error
  }
  return null;
});

const [secondarySort, setSecondarySort] = useState<{ key: SortKey; direction: SortDirection } | null>(() => {
  if (!projectId) return null;
  try {
    const stored = localStorage.getItem(`task-sort-${projectId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.secondary || null;
    }
  } catch {
    // Fallback bij parse error
  }
  return null;
});
```

### 3. Voorkeuren Opslaan bij Wijziging

Een `useEffect` hook toevoegen die de sorteerstate opslaat wanneer deze verandert:

```typescript
useEffect(() => {
  if (!projectId) return;
  
  const sortData = {
    primary: primarySort,
    secondary: secondarySort,
  };
  
  if (primarySort) {
    localStorage.setItem(`task-sort-${projectId}`, JSON.stringify(sortData));
  } else {
    localStorage.removeItem(`task-sort-${projectId}`);
  }
}, [primarySort, secondarySort, projectId]);
```

### 4. Import Toevoegen

`useEffect` moet worden toegevoegd aan de bestaande import:

```typescript
import { useState, useEffect } from "react";
```

---

## localStorage Datastructuur

```json
{
  "primary": { "key": "deel_van_huis", "direction": "asc" },
  "secondary": { "key": "deadline", "direction": "desc" }
}
```

Of `null` voor geen sortering:

```json
{
  "primary": null,
  "secondary": null
}
```

---

## Gebruikerservaring

| Actie | Resultaat |
|-------|-----------|
| Sortering instellen | Wordt direct opgeslagen in localStorage |
| Pagina herladen | Sortering blijft behouden |
| Reset klikken | localStorage wordt gewist, geen sortering |
| Ander project openen | Eigen sorteervoorkeuren per project |

---

## Bestand te Wijzigen
- `src/components/project/TaskListView.tsx`
