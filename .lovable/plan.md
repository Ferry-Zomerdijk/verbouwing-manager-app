

# Plan: Aankomende 5 Leveringen Widget

## Wijzigingen

De widget wordt aangepast om de **volgende 5 aankomende leveringen** te tonen in plaats van alle leveringen van de huidige week.

---

## Technische Wijzigingen

### Bestand: `src/components/UpcomingDeliveriesWidget.tsx`

**1. Query aanpassen (regels 27-53):**

Van:
```typescript
const weekStart = startOfWeek(today, { weekStartsOn: 1 });
const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

const { data: deliveries, isLoading } = useQuery({
  queryKey: ["upcoming-deliveries", format(weekStart, "yyyy-MM-dd")],
  queryFn: async () => {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(...)
      .not("verwachte_leverdatum", "is", null)
      .gte("verwachte_leverdatum", format(weekStart, "yyyy-MM-dd"))
      .lte("verwachte_leverdatum", format(weekEnd, "yyyy-MM-dd"))
      .order("verwachte_leverdatum", { ascending: true });
```

Naar:
```typescript
const { data: deliveries, isLoading } = useQuery({
  queryKey: ["upcoming-deliveries"],
  queryFn: async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(`
        id,
        titel,
        verwachte_leverdatum,
        project_id,
        project:projects(id, naam),
        task_type:task_types(icoon)
      `)
      .not("verwachte_leverdatum", "is", null)
      .gte("verwachte_leverdatum", today)  // Vanaf vandaag
      .order("verwachte_leverdatum", { ascending: true })
      .limit(20);  // Ophalen met buffer voor filtering

    if (error) throw error;
    
    // Filter alleen "Kopen" taken en neem max 5
    return (tasks || [])
      .filter((task: any) => task.task_type?.icoon === "shopping-cart")
      .slice(0, 5) as DeliveryTask[];
  },
});
```

**2. Titel aanpassen (regel 97):**

Van:
```tsx
Leveringen deze week
```

Naar:
```tsx
Aankomende leveringen
```

**3. Lege state tekst aanpassen (regel 144):**

Van:
```tsx
Geen leveringen deze week
```

Naar:
```tsx
Geen geplande leveringen
```

**4. Verwijder ongebruikte imports en variabelen:**
- `startOfWeek`, `endOfWeek` verwijderen uit imports
- `weekStart`, `weekEnd` variabelen verwijderen

**5. Verwijder "+X meer" sectie (regels 133-137):**
Niet meer nodig omdat we altijd max 5 ophalen.

---

## Visueel Resultaat

```text
┌──────────────────────────────────────┐
│ 📦 Aankomende leveringen             │
├──────────────────────────────────────┤
│ Dakpannen bestellen                  │
│ Project Garage              Vandaag  │
│                             27 jan   │
├──────────────────────────────────────┤
│ Isolatiemateriaal                    │
│ Project Verbouwing          Morgen   │
│                             28 jan   │
├──────────────────────────────────────┤
│ Kozijnen                             │
│ Project Keuken              Woensdag │
│                             29 jan   │
├──────────────────────────────────────┤
│ Keukenkraan                          │
│ Project Keuken              5 feb    │
│                             5 feb    │
├──────────────────────────────────────┤
│ Vloertegels                          │
│ Project Badkamer            12 feb   │
│                             12 feb   │
└──────────────────────────────────────┘
```

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/UpcomingDeliveriesWidget.tsx` | Query aanpassen, titel wijzigen, imports opschonen |

