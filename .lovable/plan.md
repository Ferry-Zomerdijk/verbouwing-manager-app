

# Plan: Centraal beheer van "Deel van huis"

## Samenvatting

Maak een nieuwe database-tabel `house_parts` per project, vergelijkbaar met hoe `cost_categories` en `contact_categories` nu werken. Alle plekken die nu hardcoded lijsten of ad-hoc berekeningen gebruiken voor "deel van huis" gaan voortaan uit deze centrale bron lezen. Beheer (toevoegen, hernoemen, verwijderen, volgorde) komt in het Beheer-tabblad.

---

## Huidige situatie

"Deel van huis" opties zijn nu verspreid over meerdere bestanden met verschillende hardcoded lijsten:

- **Taken**: Autocomplete op basis van bestaande waarden uit taken
- **Kosten**: Dropdown uit gecombineerde taken + kosten waarden
- **Foto's**: Hardcoded lijst ("Woning", "Keuken", "Badkamer", etc.) + waarden uit foto's en taken
- **Onderhoud**: Aparte hardcoded lijst ("CV-ketel en verwarming", "Airconditioning", etc.)
- **Sleutels**: Weer een andere hardcoded lijst ("Woning", "Garage", "Bijgebouw", etc.)

---

## Oplossing

### 1. Nieuwe tabel: `house_parts`

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid | Primary key |
| project_id | uuid | FK naar projects |
| naam | text | Naam van het deel (bijv. "Keuken") |
| volgorde | integer | Sorteervolgorde |
| created_at | timestamptz | Aanmaakdatum |

RLS-policies volgen het bestaande patroon (`has_project_access` voor SELECT/INSERT/UPDATE, admin+owner voor DELETE).

Bij het eerste bezoek aan een project worden standaard-opties aangemaakt (seed), gecombineerd uit alle huidige lijsten:
- Woning, Keuken, Badkamer, Slaapkamer, Woonkamer, Hal, Zolder
- Garage, Schuur, Bijgebouw, Tuin en buitenruimte, Poort, Brievenbus
- CV-ketel en verwarming, Airconditioning, Dakgoten en afvoer
- Elektrische installatie, Waterleiding en sanitair
- Alarm en beveiliging, Zonnepanelen, Ventilatie en afzuiging
- Ramen en deuren, Dak, Gevels, Zwembad/jacuzzi

### 2. Nieuw beheercomponent: `HousePartsManager.tsx`

Vergelijkbaar met `CostCategoriesManager` en `ContactCategoriesManager`:
- Lijst met drag-and-drop volgorde
- Inline hernoemen
- Toevoegen en verwijderen
- Wordt getoond als derde accordion-sectie in het Beheer-tabblad

### 3. Alle componenten aanpassen

Vervang alle hardcoded lijsten en ad-hoc useMemo berekeningen door een query op `house_parts`:

| Component | Huidige bron | Nieuwe bron |
|-----------|-------------|-------------|
| ProjectTasksWithDnd | useMemo uit taken | Query `house_parts` |
| ProjectCosts | useMemo uit taken+kosten | Query `house_parts` |
| ProjectPhotos | Hardcoded DEFAULT_PARTS + data | Query `house_parts` |
| CreateMaintenanceDialog | Hardcoded HOUSE_PART_SUGGESTIONS | Query `house_parts` |
| EditMaintenanceDialog | Hardcoded HOUSE_PART_SUGGESTIONS | Query `house_parts` |
| CreateKeyDialog | Hardcoded DEFAULT_PARTS | Query `house_parts` |
| MobileTaskWizard | Props | Query `house_parts` |
| CreateCostDialog | Props | Query `house_parts` |
| EditCostDialog | Props | Query `house_parts` |

### 4. Automatisch nieuwe waarden toevoegen

Wanneer een gebruiker in een Autocomplete-veld een nieuwe waarde typt die niet in `house_parts` staat, wordt deze automatisch toegevoegd aan de tabel. Dit behoudt de flexibiliteit.

---

## Technische wijzigingen

### Database migratie

```sql
CREATE TABLE public.house_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  naam text NOT NULL,
  volgorde integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies (zelfde patroon als cost_categories)
```

Plus een database functie `initialize_house_parts(p_project_id)` die standaardwaarden aanmaakt als er nog geen bestaan.

### Nieuwe bestanden

| Bestand | Beschrijving |
|---------|-------------|
| `src/components/project/HousePartsManager.tsx` | Beheercomponent (lijst, hernoemen, toevoegen, verwijderen, volgorde) |

### Te wijzigen bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/ProjectManagement.tsx` | Derde accordion-sectie "Delen van huis" toevoegen |
| `src/components/project/ProjectTasksWithDnd.tsx` | `house_parts` query i.p.v. useMemo |
| `src/components/project/ProjectCosts.tsx` | `house_parts` query i.p.v. useMemo |
| `src/components/project/ProjectPhotos.tsx` | `house_parts` query, verwijder DEFAULT_PARTS |
| `src/components/project/CreateMaintenanceDialog.tsx` | `house_parts` query, verwijder HOUSE_PART_SUGGESTIONS |
| `src/components/project/EditMaintenanceDialog.tsx` | Idem |
| `src/components/admin/CreateKeyDialog.tsx` | `house_parts` query, verwijder DEFAULT_PARTS |
| `src/components/project/MobileTaskWizard.tsx` | Gebruik house_parts |
| `src/components/project/CreateCostDialog.tsx` | Gebruik house_parts |
| `src/components/project/EditCostDialog.tsx` | Gebruik house_parts |
| `src/lib/i18n/nl.ts` | Vertalingen voor "Delen van huis" beheer |
| `src/lib/i18n/en.ts` | Vertalingen voor "Parts of house" management |
| `src/lib/i18n/types.ts` | Types uitbreiden |

---

## Gebruikerservaring

In het Beheer-tabblad verschijnt een nieuwe sectie:

```
Beheer
├── Onderhoudsinstructies
├── Sleutelbeheer  
└── Delen van huis          <-- NIEUW
    ┌─────────────────────────────────┐
    │ Keuken                    [x]   │
    │ Badkamer                  [x]   │
    │ Woonkamer                 [x]   │
    │ CV-ketel en verwarming    [x]   │
    │ ...                             │
    │                                 │
    │ [+ Nieuwe toevoegen]            │
    └─────────────────────────────────┘
```

Alle dropdowns en autocomplete-velden in taken, kosten, foto's, onderhoud en sleutels gebruiken dan dezelfde lijst.
