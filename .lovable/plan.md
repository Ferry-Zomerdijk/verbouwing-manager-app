

# Plan: Fix — Betalers beheren toont lege velden

## Probleem

De "Betalers beheren" dialog toont 4 lege invoervelden met placeholder "Naam betaler", terwijl de standaardnamen (Ron, Monique, Gezamenlijk, Ntb) getoond zouden moeten worden.

De `cost_payers` tabel is leeg, dus het fallback-pad naar `DEFAULT_PAYERS` zou moeten werken. Het probleem zit in een race condition in de `useEffect`:

```text
Huidige flow:
1. Dialog opent: open=true, query start (isLoading=true)
2. payers = [] (destructuring default, data=undefined)
3. Effect zet DEFAULT_PAYERS (correct)
4. Query resolves: data=[] (lege tabel)
5. payers referentie verandert (undefined -> [])
6. Effect draait opnieuw, payers=[], zet DEFAULT_PAYERS opnieuw
```

Het probleem is dat de `payers` default `[]` via destructuring bij elke render een nieuwe array-referentie aanmaakt zolang `data` undefined is (tijdens loading). Dit kan leiden tot onvoorspelbaar gedrag waarbij React state updates batcht en de uiteindelijke state niet de defaults bevat.

## Oplossing

In `CostPayersManager.tsx`, de `useEffect` aanpassen om pas local state te zetten wanneer de query klaar is met laden:

```text
Wijziging in useEffect:
- Voeg !isLoading toe als voorwaarde
- Voeg isLoading toe aan dependency array
- Dit garandeert dat defaults pas worden gezet na bevestiging dat de tabel leeg is
```

## Te wijzigen bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/CostPayersManager.tsx` | `useEffect` guard toevoegen: `if (open && !isLoading)` + `isLoading` in dependency array |

## Verwacht resultaat

Wanneer de dialog opent en er geen betalers in de database staan, worden de standaardnamen (Ron, Monique, Gezamenlijk, Ntb) correct getoond in de invoervelden.
