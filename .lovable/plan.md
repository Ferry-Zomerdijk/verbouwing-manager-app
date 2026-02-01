

# Plan: Dynamische categorieën toevoegen aan Create/Edit Cost dialogs

## Probleem

De nieuw aangemaakte categorie "Installaties" verschijnt niet in de EditCostDialog en CreateCostDialog omdat deze dialogs nog hardcoded categorieën gebruiken in plaats van de `cost_categories` tabel.

---

## Huidige situatie

| Component | Categorie bron |
|-----------|---------------|
| ProjectCosts.tsx | Dynamisch via `useCostCategories()` |
| MobileCostList.tsx | Dynamisch via props |
| **EditCostDialog.tsx** | Hardcoded (7 vaste opties) |
| **CreateCostDialog.tsx** | Hardcoded (7 vaste opties) |

---

## Oplossing

Beide dialogs moeten de `useCostCategories()` hook gebruiken om dynamische categorieën op te halen, net zoals de betalers (`useCostPayers`) al dynamisch worden opgehaald.

---

## Technische wijzigingen

### 1. Wijziging: `src/components/project/EditCostDialog.tsx`

**Import toevoegen:**
```tsx
import { useCostCategories } from "./CostCategoriesManager";
```

**Hook aanroepen (rond regel 43):**
```tsx
const { data: categoryOptions = [] } = useCostCategories(projectId || "");
```

**Selecteer vervanging (regels 153-162):**
Vervang de hardcoded SelectItems door een dynamische map:
```tsx
<SelectContent>
  {categoryOptions.map((cat) => (
    <SelectItem key={cat.naam} value={cat.naam}>{cat.naam}</SelectItem>
  ))}
</SelectContent>
```

---

### 2. Wijziging: `src/components/project/CreateCostDialog.tsx`

**Import toevoegen:**
```tsx
import { useCostCategories } from "./CostCategoriesManager";
```

**Hook aanroepen (rond regel 53):**
```tsx
const { data: categoryOptions = [] } = useCostCategories(projectId);
```

**Selecteer vervanging (regels 427-435):**
Vervang de hardcoded SelectItems door een dynamische map:
```tsx
<SelectContent>
  {categoryOptions.map((cat) => (
    <SelectItem key={cat.naam} value={cat.naam}>{cat.naam}</SelectItem>
  ))}
</SelectContent>
```

---

## Resultaat

Na deze wijzigingen:
1. Alle nieuw toegevoegde categorieën (zoals "Installaties") verschijnen direct in de dropdowns
2. Categorieën worden getoond in de volgorde die is ingesteld via de Rubrieken Manager
3. Consistentie tussen alle kosten-gerelateerde componenten

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/EditCostDialog.tsx` | Dynamische categorieën via useCostCategories hook |
| `src/components/project/CreateCostDialog.tsx` | Dynamische categorieën via useCostCategories hook |

