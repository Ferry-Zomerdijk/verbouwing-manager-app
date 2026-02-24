

# Plan: Zoekfunctie in leveranciers-filter dropdown

## Samenvatting

De leveranciers-dropdown in het Kosten-filter vervangen door een doorzoekbaar menu, zodat je snel een leverancier kunt vinden door te typen.

## Gebruikerservaring

De leverancier-filterknop blijft er hetzelfde uitzien, maar bij openen verschijnt er bovenaan een zoekveld. Terwijl je typt worden de leveranciers direct gefilterd. "Alle leveranciers" blijft altijd zichtbaar bovenaan.

```text
+---------------------------+
| [Zoek leverancier...]     |
+---------------------------+
| v  Alle leveranciers      |
|    ABE maatwerk            |
|    Aannemingsbedrijf R...  |
|    AliExpress              |
+---------------------------+
```

## Technische wijzigingen

### ProjectCosts.tsx

De bestaande `Select` component voor leveranciers (regels 780-792) vervangen door een **Popover + Command** combobox:

- `Popover` als container (uit `@/components/ui/popover`)
- `Command` met `CommandInput` (zoekveld), `CommandList`, `CommandEmpty`, `CommandGroup` en `CommandItem` (uit `@/components/ui/command`)
- De trigger-knop behoudt dezelfde styling als de andere filterknopppen
- Bij selectie van een leverancier: `setLeverancierFilter()` aanroepen en popover sluiten
- State toevoegen: `leverancierPopoverOpen` (boolean)
- Geselecteerde leverancier tonen met een vinkje in de lijst

### Te wijzigen bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/ProjectCosts.tsx` | Leverancier `Select` vervangen door `Popover + Command` combobox met zoekfunctie |

Er zijn geen database- of i18n-wijzigingen nodig. De bestaande imports van `Popover` en `Command` componenten worden hergebruikt.

