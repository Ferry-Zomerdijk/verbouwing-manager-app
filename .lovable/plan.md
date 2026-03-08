

# Periode-functie verbeteren voor onderhoudstaken

## Wijzigingen

### 1. MonthPicker: "Selecteer maand" optie om te resetten
Voeg een lege/reset optie toe aan de MonthPicker Select dropdown zodat gebruikers een geselecteerde maand weer kunnen wissen.

**`src/components/project/MonthPicker.tsx`**: Voeg een extra `SelectItem` toe bovenaan de lijst met value `"__none__"` en label "Selecteer maand" / "Select month". Bij selectie van deze optie wordt `onChange(null)` aangeroepen.

### 2. Tijdlijn sorteren op volgende actiedatum
De tijdlijnweergave sorteert nu op `periode_van` (beginmaand). Dit wordt gewijzigd naar sortering op de **eerstvolgende onderhoudsdatum** (`laatste_onderhoud` + `frequentie`), zodat de meest urgente taken bovenaan staan.

**`src/components/project/MaintenanceTimelineView.tsx`**: 
- Sorteer items primair op berekende `nextMaintenance` datum (items zonder datum onderaan)
- Toon als platte lijst i.p.v. gegroepeerd per maand, gesorteerd op urgentie

### 3. Tagline/hint bij periode-velden
Voeg een kleine helptekst toe onder de periode-velden in zowel Create als Edit dialogen.

**`src/components/project/CreateMaintenanceDialog.tsx`** en **`EditMaintenanceDialog.tsx`**: Voeg een `<p className="text-xs text-muted-foreground">` toe na de twee MonthPicker velden.

**`src/lib/i18n/nl.ts`** en **`en.ts`**: Nieuwe key `periodHint` met tekst "Niet verplicht — laat leeg als het onderhoud het hele jaar door kan" / "Optional — leave empty if maintenance applies all year round".

