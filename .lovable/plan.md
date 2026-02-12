

# Plan: Automatische A-Z sortering voor "Delen van huis"

## Samenvatting

Sorteer de lijst "Delen van huis" altijd automatisch alfabetisch (A-Z). Handmatige sortering (pijltjes omhoog/omlaag) wordt verwijderd uit de beheerweergave.

## Wijzigingen

### 1. `src/hooks/useHouseParts.tsx`

- Wijzig `.order("volgorde")` naar `.order("naam")` zodat de database de data alfabetisch retourneert
- `housePartNames` is dan automatisch ook A-Z gesorteerd
- `ensureHousePart` hoeft geen `volgorde` meer te berekenen, gewoon `volgorde: 0` gebruiken

### 2. `src/components/project/HousePartsManager.tsx`

- Verwijder de `ChevronUp`/`ChevronDown` import en de `handleMoveUp`/`handleMoveDown` functies
- Verwijder de pijltjesknoppen uit de lijst-items
- Sorteer `localParts` altijd alfabetisch bij laden en na toevoegen/hernoemen
- Bij opslaan (`saveParts`): `volgorde` gewoon op 0 zetten (niet meer relevant)

### 3. `src/components/project/ProjectTasksWithDnd.tsx`

- De `availableDelenVanHuis` useMemo combineert `housePartNames` met waarden uit taken. Sorteer het resultaat ook A-Z (dit gebeurt al met `.sort()`, dus dit is al correct).

## Resultaat

- Overal waar "Deel van huis" opties verschijnen (taken, kosten, foto's, onderhoud, sleutels, beheer) is de lijst automatisch A-Z gesorteerd
- Geen handmatige volgorde meer nodig
- Eenvoudiger UI in het beheer
