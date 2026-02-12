
# Plan: Detailpagina per "Deel van huis" met gekoppelde items

## Samenvatting

Wanneer je in Beheer op een "deel van huis" klikt, opent een detail-dialog (Drawer op mobiel, Dialog op desktop) met een overzicht van alle gekoppelde items (taken, kosten, foto's, onderhoudsinstructies, sleutels). Daarnaast wordt bij elk deel in de lijst een badge getoond met het totaal aantal gekoppelde items.

## Wijzigingen

### 1. Nieuw component: `src/components/project/HousePartDetailDialog.tsx`

- Dialog/Drawer (mobiel = Drawer, desktop = Dialog, conform bestaand patroon)
- Props: `projectId`, `partName`, `open`, `onOpenChange`
- Haalt gekoppelde items op via 5 queries (taken, kosten, foto's, onderhoud, sleutels) met volledige data (niet alleen count)
- Toont items gegroepeerd per type in een accordion of sectie-indeling met iconen:
  - Taken (ListTodo): titel, status
  - Kosten (Euro): beschrijving, bedrag
  - Foto's (Image): notitie of bestandsnaam
  - Onderhoud (Wrench): titel
  - Sleutels (Key): key_number, deel_van_huis
- Lege secties worden verborgen

### 2. Wijziging: `src/components/project/HousePartsManager.tsx`

- Per item in de lijst: een klikbaar badge/chip tonen met het totaal aantal gekoppelde items (bijv. "5")
- Gebruik `useQuery` om voor elk deel de counts op te halen (hergebruik `checkHousePartUsage`)
- Klik op de naam of de badge opent de `HousePartDetailDialog`
- State toevoegen: `selectedPart` voor welk deel het detailscherm open is

### 3. i18n uitbreidingen (`types.ts`, `nl.ts`, `en.ts`)

- `houseParts.detail.title`: "Overzicht: {name}" / "Overview: {name}"
- `houseParts.detail.noItems`: "Geen gekoppelde items" / "No linked items"
- `houseParts.detail.linkedItems`: "Gekoppelde items" / "Linked items"

## Technische details

### Count-badge per item

In `HousePartsManager`, na het laden van de parts, worden de counts per part opgehaald via een enkele `useQuery` die `checkHousePartUsage` aanroept voor elk bestaand part (niet voor nieuwe). Het resultaat wordt opgeslagen als een map: `Record<string, number>`.

```text
  [Badkamer] ---- [3] ---- [prullenbak]
  [Keuken]  ---- [7] ---- [prullenbak]
  [Tuin]    ---- [0] ---- [prullenbak]
```

### Detail-dialog structuur

```text
+----------------------------------+
| Overzicht: Keuken            [X] |
+----------------------------------+
| > Taken (3)                      |
|   - Tegels leggen (Te doen)      |
|   - Kraan vervangen (Lopend)     |
|   - Afzuigkap (Afgerond)        |
|                                  |
| > Kosten (2)                     |
|   - Tegels   EUR 450            |
|   - Kraan    EUR 120            |
|                                  |
| > Foto's (2)                     |
|   - Foto 1                      |
|   - Foto 2                      |
+----------------------------------+
```

### Bestanden die worden aangemaakt/gewijzigd

| Bestand | Actie |
|---------|-------|
| `src/components/project/HousePartDetailDialog.tsx` | Nieuw |
| `src/components/project/HousePartsManager.tsx` | Badge + klik-handler toevoegen |
| `src/lib/i18n/types.ts` | Detail-teksten toevoegen |
| `src/lib/i18n/nl.ts` | NL vertalingen |
| `src/lib/i18n/en.ts` | EN vertalingen |
