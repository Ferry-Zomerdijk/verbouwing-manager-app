
# Plan: Sorteren op Datum en Bedrag voor Kosten

## Samenvatting

Voeg sorteerfunctionaliteit toe aan de kostentabel zodat gebruikers kunnen sorteren op Datum (oplopend/aflopend) en Bedrag (oplopend/aflopend). Dit volgt het bestaande patroon uit de TaskListView met localStorage persistentie.

---

## Huidige situatie

De kostentabel toont standaard kosten gesorteerd op datum (nieuwste eerst, vanuit de database query). Er is geen mogelijkheid voor gebruikers om de sortering aan te passen.

---

## Technische aanpak

### State toevoegen voor sortering

```typescript
type CostSortKey = "datum" | "bedrag";
type SortDirection = "asc" | "desc";

const [sortConfig, setSortConfig] = useState<{ 
  key: CostSortKey; 
  direction: SortDirection 
} | null>(() => {
  // Laad uit localStorage
  const stored = localStorage.getItem(`costs-sort-${projectId}`);
  return stored ? JSON.parse(stored) : null;
});
```

### Sorteerlogica implementeren

```typescript
const sortedCosts = useMemo(() => {
  if (!filteredCosts.length || !sortConfig) return filteredCosts;
  
  return [...filteredCosts].sort((a, b) => {
    let aVal, bVal;
    
    if (sortConfig.key === "datum") {
      aVal = new Date(a.datum).getTime();
      bVal = new Date(b.datum).getTime();
    } else {
      aVal = parseFloat(a.bedrag.toString());
      bVal = parseFloat(b.bedrag.toString());
    }
    
    return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
  });
}, [filteredCosts, sortConfig]);
```

### SortButton component (vergelijkbaar met TaskListView)

```typescript
const SortButton = ({ column, label }: { column: CostSortKey; label: string }) => {
  const isActive = sortConfig?.key === column;
  const direction = isActive ? sortConfig?.direction : null;

  return (
    <Button variant="ghost" size="sm" onClick={() => handleSort(column)}>
      {label}
      {direction === "asc" && <ArrowUp className="ml-1 h-3 w-3" />}
      {direction === "desc" && <ArrowDown className="ml-1 h-3 w-3" />}
      {!direction && <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
    </Button>
  );
};
```

### Tabel headers aanpassen

| Kolom | Was | Wordt |
|-------|-----|-------|
| Datum | `<TableHead>Datum</TableHead>` | `<TableHead><SortButton column="datum" label="Datum" /></TableHead>` |
| Bedrag | `<TableHead>Bedrag</TableHead>` | `<TableHead><SortButton column="bedrag" label="Bedrag" /></TableHead>` |

---

## Wijzigingen in ProjectCosts.tsx

1. **Imports toevoegen**: `ArrowUpDown`, `ArrowUp`, `ArrowDown` uit lucide-react
2. **Types definiëren**: `CostSortKey` en `SortDirection`
3. **State toevoegen**: `sortConfig` met localStorage persistentie
4. **Sorteerlogica**: `sortedCosts` useMemo
5. **SortButton component**: Herbruikbare sorteerknop
6. **handleSort functie**: Toggle sortering logica
7. **TableHead updaten**: Datum en Bedrag klikbaar maken
8. **Render sortered costs**: Gebruik `sortedCosts` in plaats van `filteredCosts`

---

## Gebruikerservaring

- Klik op "Datum" of "Bedrag" kolom header om te sorteren
- Eerste klik: oplopend (↑)
- Tweede klik: aflopend (↓)
- Derde klik: reset naar standaard
- Sortering blijft behouden bij paginaverversing (localStorage)
- Indicator toont actieve sortering met pijltje

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/ProjectCosts.tsx` | Sorteerfunctionaliteit toevoegen voor Datum en Bedrag kolommen |
