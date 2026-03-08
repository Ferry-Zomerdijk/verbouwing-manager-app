

# Tijdlijn weergave verbeteren: volgende datum prominent + "Indien nodig" sectie

## Huidige situatie
De TimelineCard toont de "volgende keer" datum als een klein tekst-item tussen andere metadata. Items zonder berekende datum worden gemengd met geplande items.

## Wijzigingen

### 1. TimelineCard redesign — volgende datum prominent bovenaan
De **volgende onderhoudsdatum** wordt het eerste en meest opvallende element op elke kaart:
- Grote, duidelijke datum links naast de titel (of als eerste regel boven de metadata)
- Achterstallige datums in rood, aankomende in een opvallend kleur-accent
- Verwijder de datum uit de metadata-rij (geen duplicaat)

### 2. Drie secties in plaats van twee
Splits de lijst in drie duidelijke secties:
1. **Achterstallig** (rood, AlertTriangle) — taken waarvan de volgende datum in het verleden ligt
2. **Gepland** (CalendarClock) — taken met een berekende volgende datum in de toekomst, gesorteerd op datum
3. **Indien nodig** (nieuw, onderaan) — taken zonder `laatste_onderhoud` of `frequentie`, dus geen berekende datum

### 3. i18n updates
- NL: `ifNeeded: "Indien nodig"`, `ifNeededDescription: "Taken zonder vastgestelde datum"`
- EN: `ifNeeded: "If needed"`, `ifNeededDescription: "Tasks without a scheduled date"`

### Bestanden
- **`src/components/project/MaintenanceTimelineView.tsx`** — card redesign + 3-sectie layout
- **`src/lib/i18n/nl.ts`** + **`en.ts`** — nieuwe keys
- **`src/lib/i18n/types.ts`** — type uitbreiden

