

# Plan: Fix — Betalers beheren toont lege velden (queryKey conflict)

## Probleem

De "Betalers beheren" dialog toont lege invoervelden omdat twee queries dezelfde cache-key delen maar verschillende data-transformaties uitvoeren:

```text
useCostPayers() hook:
  queryKey: ["cost-payers", projectId]
  queryFn: returns string[]  -->  ["Ron", "Monique", ...]

CostPayersManager query:
  queryKey: ["cost-payers", projectId]
  queryFn: returns CostPayer[]  -->  [{id, naam, sort_order}, ...]
```

Omdat `useCostPayers` altijd actief is (gebruikt in ProjectCosts, CreateCostDialog, EditCostDialog), wordt de cache gevuld met `string[]`. Wanneer de dialog opent, leest die de gecachte strings als objecten. `payer.naam` is dan `undefined`, wat lege velden oplevert.

## Oplossing

De `useCostPayers` hook aanpassen om een **aparte queryKey** te gebruiken, zodat de twee queries hun eigen cache hebben.

## Te wijzigen bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/CostPayersManager.tsx` | queryKey in `useCostPayers` hook wijzigen van `["cost-payers", projectId]` naar `["cost-payer-names", projectId]` |

## Concrete wijziging

In de `useCostPayers` functie (regel 274):

```text
Huidige code:   queryKey: ["cost-payers", projectId]
Nieuwe code:    queryKey: ["cost-payer-names", projectId]
```

Daarnaast moet de `savePayers` mutatie in `onSuccess` ook deze tweede queryKey invalideren zodat de namen-lijst mee-update na opslaan:

```text
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["cost-payers", projectId] });
  queryClient.invalidateQueries({ queryKey: ["cost-payer-names", projectId] });  // toevoegen
  ...
}
```

## Verwacht resultaat

- De dialog toont bestaande betalers correct (of de standaardnamen als er geen opgeslagen zijn)
- Na opslaan worden beide caches bijgewerkt
- De dropdowns in CreateCostDialog en EditCostDialog blijven correct werken

