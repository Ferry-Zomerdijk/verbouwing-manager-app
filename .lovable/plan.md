

# Plan: Voltooide Taken Uitsluiten van Leveringen Widget

## Probleem

De huidige query haalt alle taken op met een verwachte leverdatum, ongeacht hun status. Taken die al zijn afgerond (status = "Gereed") worden nog steeds getoond in de widget "Aankomende leveringen".

---

## Oplossing

Voeg een filter toe aan de Supabase query om taken met status "Gereed" uit te sluiten.

---

## Technische Wijziging

### Bestand: `src/components/UpcomingDeliveriesWidget.tsx`

**Huidige query (regels 29-42):**

```typescript
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
  .gte("verwachte_leverdatum", today)
  .order("verwachte_leverdatum", { ascending: true })
  .limit(20);
```

**Nieuwe query met status filter:**

```typescript
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
  .gte("verwachte_leverdatum", today)
  .neq("status", "Gereed")  // ← NIEUWE REGEL: Sluit voltooide taken uit
  .order("verwachte_leverdatum", { ascending: true })
  .limit(20);
```

---

## Wat deze wijziging doet

| Voorheen | Na wijziging |
|----------|--------------|
| Alle taken met leverdatum vanaf vandaag | Alleen niet-voltooide taken met leverdatum vanaf vandaag |
| Voltooide leveringen blijven zichtbaar | Voltooide leveringen verdwijnen automatisch |

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/UpcomingDeliveriesWidget.tsx` | Toevoegen `.neq("status", "Gereed")` aan de query |

