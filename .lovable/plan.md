
# Plan: Duplicaat-factuurdetectie & Leverancierslijst

## Samenvatting

Twee verbeteringen aan het kostenbeheer:

1. **Duplicaat-factuurdetectie**: Bij het uploaden van een factuur controleren of hetzelfde bestand al eerder is geupload, zodat dubbelingen worden voorkomen.
2. **Leverancierslijst**: Een centrale leverancierstabel per project, vergelijkbaar met hoe `cost_payers` en `cost_categories` al werken. Leveranciersnamen worden hergebruikt via een autocomplete-veld met de mogelijkheid om nieuwe leveranciers toe te voegen.

---

## 1. Duplicaat-factuurdetectie

### Aanpak

Bij het uploaden van een factuur (zowel via AI-scan als handmatige upload) wordt een hash (SHA-256) van het bestand berekend en vergeleken met eerder opgeslagen hashes.

### Database

Een nieuwe kolom toevoegen aan de `costs` tabel:

```sql
ALTER TABLE costs ADD COLUMN file_hashes text[] DEFAULT '{}';
```

Deze kolom bevat de SHA-256 hashes van alle geuploadde factuurbestanden bij die kostenpost.

### Werking

1. Gebruiker selecteert een bestand
2. In de browser wordt een SHA-256 hash berekend via de Web Crypto API (snel, geen server nodig)
3. Een query controleert of deze hash al voorkomt in `costs.file_hashes` binnen hetzelfde project
4. Bij een match: toon een waarschuwing met details van de bestaande kostenpost (bedrag, leverancier, datum)
5. De gebruiker kan alsnog doorgaan (geen harde blokkade) of annuleren
6. Bij opslaan wordt de hash opgeslagen in `file_hashes`

### Te wijzigen bestanden

| Bestand | Wijziging |
|---------|-----------|
| **Migratie** | `file_hashes` kolom toevoegen aan `costs` |
| `CreateCostDialog.tsx` | Hash berekenen bij upload, duplicaatcheck uitvoeren, waarschuwing tonen, hash meesturen bij insert |
| `EditCostDialog.tsx` | Hash berekenen bij nieuwe upload, duplicaatcheck, hash meesturen bij update |
| `MobileCostCard.tsx` | Geen wijziging nodig |

---

## 2. Leverancierslijst

### Huidige situatie

Het leveranciersveld is nu een vrij tekstveld (`Input`). Unieke leveranciers worden afgeleid uit bestaande kostenposten voor het filter. Er is al een `AutocompleteInput` component beschikbaar en er bestaan al vergelijkbare patronen voor `cost_payers` en `cost_categories`.

### Aanpak

Een nieuwe `suppliers` tabel per project, met een bijbehorende `SuppliersManager` component (vergelijkbaar met `CostPayersManager`). Het leveranciersveld in de formulieren wordt vervangen door de bestaande `AutocompleteInput` component, gevoed met de leverancierslijst. Nieuwe namen kunnen direct vanuit het veld worden toegevoegd.

### Database

```sql
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  naam text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, naam)
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- RLS policies: has_project_access patroon (SELECT, INSERT, UPDATE, DELETE)
```

### Werking

- In `CreateCostDialog` en `EditCostDialog`: het `Input`-veld voor leverancier wordt vervangen door `AutocompleteInput` met `allowCreate=true`
- Bij het selecteren van een bestaande leverancier wordt de naam overgenomen
- Bij het typen van een nieuwe naam en bevestigen wordt automatisch een nieuwe leverancier aangemaakt in de `suppliers` tabel
- Een `SuppliersManager` component (bereikbaar via het instellingen-menu bij kosten) toont alle leveranciers en biedt de mogelijkheid om namen te bewerken, samen te voegen of te verwijderen
- Het filter in `ProjectCosts` gebruikt ook de `suppliers` tabel als bron

### Te wijzigen bestanden

| Bestand | Wijziging |
|---------|-----------|
| **Migratie** | `suppliers` tabel aanmaken met RLS policies |
| Nieuw: `SuppliersManager.tsx` | Beheercomponent voor leveranciers (CRUD), inclusief `useSuppliers` hook, naar voorbeeld van `CostPayersManager` |
| `CreateCostDialog.tsx` | `Input` vervangen door `AutocompleteInput` met leverancierslijst + auto-create |
| `EditCostDialog.tsx` | Idem |
| `ProjectCosts.tsx` | Leveranciersfilter voeden vanuit `suppliers` tabel i.p.v. unieke waarden uit kosten; settings-menu uitbreiden met "Leveranciers beheren" |
| `MobileCostList.tsx` | Settings-menu uitbreiden met leveranciersbeheer |

### Migratie van bestaande data

De migratie bevat een `INSERT INTO suppliers ... SELECT DISTINCT leverancier FROM costs` statement om bestaande leveranciersnamen automatisch over te nemen, zodat er geen data verloren gaat.

---

## Technische details

### Hash-berekening (browser)

```text
async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  // Convert to hex string
}
```

### Duplicaat-query

```text
SELECT id, bedrag, leverancier, datum 
FROM costs 
WHERE project_id = ? 
AND file_hashes && ARRAY[?]
AND id != ? (bij edit)
```

### Volgorde van implementatie

1. Database migratie (beide tabellen tegelijk)
2. `SuppliersManager` component + `useSuppliers` hook
3. Leveranciers-autocomplete in Create/Edit dialogen
4. Duplicaat-factuurdetectie in Create/Edit dialogen
5. Settings-menu en filter updates in ProjectCosts
