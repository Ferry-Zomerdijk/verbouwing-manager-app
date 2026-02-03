
# Plan: Categorieën synchroniseren met instellingen

## Samenvatting

De dropdown voor categorieën in de kostenlijst (zowel filters als inline editing) gebruikt nu hardcoded waarden in plaats van de dynamische categorieën uit de instellingen. Daarnaast moet "Rubrieken" overal hernoemd worden naar "Categorieën".

---

## Huidige situatie

| Locatie | Probleem |
|---------|----------|
| Filter dropdown (ProjectCosts.tsx) | Hardcoded: Materiaal, Arbeid, etc. |
| Inline edit dropdown (ProjectCosts.tsx) | Hardcoded: Materiaal, Arbeid, etc. |
| Knop desktop "Rubrieken" | Moet "Categorieën" worden |
| CostCategoriesManager dialoog titel | "Rubrieken beheren" → "Categorieën beheren" |
| MobileCostList tooltip | "Rubrieken beheren" → "Categorieën beheren" |
| Diverse teksten | "rubriek" → "categorie" |

---

## Oplossing

### 1. ProjectCosts.tsx - Filter dropdown dynamisch maken (regels 676-689)

```typescript
// Was: hardcoded lijst
<SelectItem value="Materiaal">Materiaal</SelectItem>
<SelectItem value="Arbeid">Arbeid</SelectItem>
// etc.

// Wordt: dynamisch vanuit categoryOptions
{categoryOptions.map(cat => (
  <SelectItem key={cat.naam} value={cat.naam}>{cat.naam}</SelectItem>
))}
```

### 2. ProjectCosts.tsx - Inline edit dropdown dynamisch maken (regels 811-822)

```typescript
// Was:
options={[
  { value: "Materiaal", label: "Materiaal" },
  { value: "Arbeid", label: "Arbeid" },
  // etc.
]}

// Wordt:
options={categoryOptions.map(cat => ({ 
  value: cat.naam, 
  label: cat.naam 
}))}
```

### 3. Naam wijzigen "Rubrieken" → "Categorieën"

**ProjectCosts.tsx (desktop knop, regel 418-419):**
```typescript
<span className="hidden sm:inline">Categorieën</span>
```

**CostCategoriesManager.tsx:**
- Dialoog titel: "Categorieën beheren"
- Beschrijving: "Configureer categorieën voor je kosten..."
- Placeholder: "Naam categorie"
- Button: "Nieuwe categorie toevoegen"
- Error: "Voeg minimaal één categorie toe"

**MobileCostList.tsx (tooltip regel 158):**
```typescript
title="Categorieën beheren"
```

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/ProjectCosts.tsx` | Dynamische categorieën in filter + inline edit + knoplabel |
| `src/components/project/CostCategoriesManager.tsx` | Alle "rubriek" teksten → "categorie" |
| `src/components/project/MobileCostList.tsx` | Tooltip tekst aanpassen |

---

## Resultaat na implementatie

- De filter dropdown toont categorieën in de volgorde zoals geconfigureerd
- De inline edit dropdown toont dezelfde categorieën in dezelfde volgorde  
- Nieuwe/verwijderde categorieën zijn direct zichtbaar in alle dropdowns
- Consistente naamgeving "Categorieën" door de hele applicatie
