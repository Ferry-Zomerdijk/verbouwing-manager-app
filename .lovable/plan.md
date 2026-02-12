

# Plan: Gebruikscontrole bij verwijderen "Deel van huis"

## Samenvatting

Voordat een "deel van huis" verwijderd kan worden, controleren we of het gekoppeld is aan taken, kosten, foto's, onderhoudsinstructies of sleutels. Als het in gebruik is, tonen we een foutmelding met precies waar het voorkomt.

## Aanpak

### Controle bij verwijderen

Wanneer een gebruiker op het prullenbak-icoon klikt, wordt er een query uitgevoerd op de volgende tabellen (kolom `deel_van_huis`):

| Tabel | Kolom |
|-------|-------|
| `tasks` | `deel_van_huis` |
| `costs` | `deel_van_huis` |
| `photos` | `deel_van_huis` |
| `maintenance_instructions` | `deel_van_huis` |
| `keys` | `deel_van_huis` |

Als er resultaten zijn, wordt een `toast.error` getoond met een opsomming, bijvoorbeeld:

> **"Keuken" is nog in gebruik bij:**
> - 3 taken
> - 1 kostenpost
> - 2 foto's

Het item wordt dan **niet** verwijderd uit de lokale lijst.

### Ook controle bij opslaan

De huidige save-functie verwijdert **alle** house_parts en voegt ze opnieuw in. Als een gebruiker een deel verwijdert en dan op "Opslaan" klikt, moeten we ook controleren of verwijderde items niet in gebruik zijn. We vergelijken de opgeslagen lijst met de oorspronkelijke lijst om te bepalen welke namen zijn verwijderd, en controleren deze.

## Technische wijzigingen

### `src/components/project/HousePartsManager.tsx`

- Nieuwe async functie `checkUsage(naam: string)` die 5 count-queries uitvoert
- `handleDelete` wordt async: roept `checkUsage` aan en toont foutmelding als het item in gebruik is
- `handleSave` controleert ook verwijderde items voordat de mutatie wordt uitgevoerd

### `src/lib/i18n/types.ts`

- Nieuw message: `inUse: string`

### `src/lib/i18n/nl.ts`

- `inUse`: `"'{name}' is nog in gebruik bij: {details}. Verwijder deze eerst."`
- Plus labels voor de entiteiten: taken, kosten, foto's, onderhoudsinstructies, sleutels

### `src/lib/i18n/en.ts`

- `inUse`: `"'{name}' is still in use by: {details}. Remove these first."`

## Gebruikerservaring

1. Gebruiker klikt op prullenbak bij "Keuken"
2. Systeem controleert alle tabellen
3. Als in gebruik: rode toast met lijst waar het voorkomt
4. Als niet in gebruik: item verdwijnt uit de lijst (zoals nu)
