

# Plan: Tweewekelijks + aangepaste periode bij frequentie

## Samenvatting

Twee toevoegingen aan het frequentiemenu van onderhoudsinstructies:
1. **Tweewekelijks** als vaste optie tussen Wekelijks en Maandelijks
2. **Aangepast** als optie onderaan het menu, waarmee de gebruiker zelf een getal + eenheid kan kiezen (bijv. "Elke 3 maanden", "Elke 6 weken")

## Gebruikerservaring

Wanneer de gebruiker "Aangepast" selecteert in het frequentiemenu, verschijnen twee extra invoervelden:

```text
Frequentie:  [Aangepast        v]

  Elke [ 3 ]  [ maanden  v ]
```

De eenheden zijn: dagen, weken, maanden, jaren.

De waarde wordt opgeslagen als tekst in de bestaande `frequentie` kolom, bijv. `"Elke 3 maanden"`. Er is geen databasewijziging nodig.

## Technische wijzigingen

### i18n (`types.ts`, `nl.ts`, `en.ts`)

Nieuwe vertalingen toevoegen:

| Key | NL | EN |
|-----|----|----|
| `frequencies.biweekly` | Tweewekelijks | Biweekly |
| `frequencies.custom` | Aangepast | Custom |
| `frequencies.every` | Elke | Every |
| `frequencies.days` | dagen | days |
| `frequencies.weeks` | weken | weeks |
| `frequencies.months` | maanden | months |
| `frequencies.years` | jaren | years |

### CreateMaintenanceDialog.tsx

- "Tweewekelijks" toevoegen als vaste optie na "Wekelijks"
- "Aangepast" toevoegen als laatste optie
- State toevoegen: `customAmount` (number) en `customUnit` (string)
- Wanneer "Aangepast" geselecteerd: extra invoervelden tonen (number input + select voor eenheid)
- Bij submit: als frequentie "Aangepast" is, wordt de waarde samengesteld als `"Elke {amount} {unit}"` (bijv. "Elke 3 maanden")
- Bij laden: als bestaande waarde begint met "Elke", automatisch "Aangepast" selecteren en de velden vullen

### EditMaintenanceDialog.tsx

- Identieke wijzigingen als CreateMaintenanceDialog
- Bij openen: als de opgeslagen frequentie begint met "Elke", wordt "Aangepast" geselecteerd en worden `customAmount` en `customUnit` geparsed uit de bestaande waarde

### Te wijzigen bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/i18n/types.ts` | Nieuwe frequency-keys |
| `src/lib/i18n/nl.ts` | NL vertalingen |
| `src/lib/i18n/en.ts` | EN vertalingen |
| `src/components/project/CreateMaintenanceDialog.tsx` | Tweewekelijks + aangepaste periode UI |
| `src/components/project/EditMaintenanceDialog.tsx` | Tweewekelijks + aangepaste periode UI |
