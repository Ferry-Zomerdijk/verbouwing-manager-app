

# Plan: Kostencategorieën Manager toevoegen aan Kosten pagina

## Samenvatting

Een "Rubrieken" (categorieën) beheer functionaliteit toevoegen aan de Kosten pagina, vergelijkbaar met de "Betalers" manager. Dit vereist een architectuurwijziging: van database enum naar een configureerbare tabel per project.

---

## Huidige situatie vs. gewenste situatie

| Aspect | Huidige situatie | Gewenste situatie |
|--------|------------------|-------------------|
| Opslag | Database enum `cost_category` | Nieuwe tabel `cost_categories` per project |
| Waarden | Vaste 7 categorieën | Per project configureerbaar |
| Toevoegen | Niet mogelijk (database migratie) | Via UI |
| Volgorde | Niet instelbaar | Via drag/up-down knoppen |

---

## Benodigde wijzigingen

### Database (Supabase migratie)

Nieuwe tabel `cost_categories` aanmaken:

```sql
CREATE TABLE public.cost_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  naam text NOT NULL,
  kleur text DEFAULT 'gray',
  volgorde integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- RLS policies (zelfde als cost_payers)
ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories of accessible projects"
  ON public.cost_categories FOR SELECT
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create categories for accessible projects"
  ON public.cost_categories FOR INSERT
  WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update categories for accessible projects"
  ON public.cost_categories FOR UPDATE
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete categories"
  ON public.cost_categories FOR DELETE
  USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM projects WHERE id = cost_categories.project_id AND user_id = auth.uid())
  );
```

---

### Nieuw bestand: `src/components/project/CostCategoriesManager.tsx`

Nieuwe component gebaseerd op `CostPayersManager`:

- Dialog met lijst van categorieën
- Inline bewerken van namen
- Optioneel: kleur selectie per categorie (voor charts)
- Up/down knoppen voor volgorde
- Toevoegen en verwijderen
- Reset naar standaard (de huidige 7 categorieën)

**Standaard categorieën:**
1. Materiaal (blauw)
2. Arbeid (paars)
3. Vergunningen (oranje)
4. Kluswerkzaamheden (groen)
5. Decoratie (roze)
6. Meubels (amber)
7. Overig (grijs)

---

### Wijziging: `src/components/project/ProjectCosts.tsx`

1. **State toevoegen:** `categoriesManagerOpen`
2. **Knop toevoegen:** naast "Betalers" knop een "Rubrieken" knop met Settings icoon
3. **Hook:** `useCostCategories(projectId)` voor ophalen categorieën
4. **Manager component:** `<CostCategoriesManager />`

---

### Wijziging: `src/components/project/CreateCostDialog.tsx`

- Vervang hardcoded `<SelectItem>` elementen door dynamische lijst van `useCostCategories()`
- Fallback naar standaard categorieën als nog geen project-specifieke zijn

---

### Wijziging: `src/components/project/EditCostDialog.tsx`

- Zelfde aanpassing als CreateCostDialog

---

### Wijziging: `src/components/project/MobileCostList.tsx`

1. Prop toevoegen: `categoryOptions` (dynamisch)
2. Prop toevoegen: `onOpenCategoriesManager`
3. Knop toevoegen in header

---

### Wijziging: Chart kleuren (ProjectCosts.tsx, MobileCostList.tsx)

- `CATEGORY_CHART_COLORS` dynamisch maken op basis van `cost_categories.kleur`
- Fallback naar standaard kleuren

---

## i18n updates

### `src/lib/i18n/nl.ts` en `en.ts`

```typescript
costs: {
  dialogs: {
    // ... bestaande
    categoriesManagerTitle: "Rubrieken beheren",
    categoriesManagerDescription: "Configureer rubrieken voor je kosten. Deze verschijnen in de categorie dropdown.",
  },
  messages: {
    // ... bestaande
    categoriesSaved: "Rubrieken opgeslagen",
    minOneCategory: "Voeg minimaal één rubriek toe",
  },
}
```

---

## Migratiepad bestaande data

De `costs.categorie` kolom blijft een enum. Om dit volledig te ondersteunen zijn er twee opties:

### Optie A: Enum behouden (aanbevolen voor nu)
- Categorieën manager werkt alleen als "display" configuratie
- Categorie filter en charts gebruiken project-specifieke lijst
- Database enum blijft de bron van waarheid
- **Voordeel:** Geen breaking changes, bestaande data blijft werken

### Optie B: Enum vervangen door text (toekomst)
- Nieuwe migratie om `categorie` enum naar text te converteren
- Volledige vrijheid in categorieën
- **Nadeel:** Grotere database wijziging, validatie in applicatie

**Aanbeveling:** Start met Optie A voor snelle implementatie.

---

## Bestanden te wijzigen/maken

| Bestand | Actie |
|---------|-------|
| Supabase migratie | Nieuw: `cost_categories` tabel |
| `src/components/project/CostCategoriesManager.tsx` | Nieuw |
| `src/components/project/ProjectCosts.tsx` | Wijzigen |
| `src/components/project/CreateCostDialog.tsx` | Wijzigen |
| `src/components/project/EditCostDialog.tsx` | Wijzigen |
| `src/components/project/MobileCostList.tsx` | Wijzigen |
| `src/lib/i18n/nl.ts` | Wijzigen |
| `src/lib/i18n/en.ts` | Wijzigen |
| `src/lib/i18n/types.ts` | Wijzigen |

---

## UI Flow

1. Gebruiker klikt op "Rubrieken" knop (Settings icoon)
2. Dialog opent met alle categorieën (standaard of project-specifiek)
3. Per categorie: up/down knoppen + naam input + kleur selector + delete knop
4. Onderaan: "Nieuwe rubriek toevoegen" knop
5. "Standaard" knop laadt de 7 standaard categorieën
6. "Opslaan" slaat alle wijzigingen op

---

## Opmerking

Omdat de kostencategorieën een database enum zijn, beperkt dit de flexibiliteit. De manager zal in eerste instantie de bestaande 7 categorieën tonen en alleen de volgorde/kleuren aanpasbaar maken. Volledige vrijheid vereist een database migratie om de enum naar text te converteren.

