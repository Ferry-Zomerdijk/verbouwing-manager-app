
# Plan: Taaktype Iconen Toevoegen aan Taken Query

## Probleem
In de "Type" kolom van de takenlijst worden geen iconen getoond. De oorzaak is dat bij het ophalen van taken het `icoon` veld niet wordt meegenomen in de Supabase query.

## Analyse

### Huidige Query (regel 119)
```typescript
.select("*, begindatum, deel_van_huis, type_id, task_type:task_types(id, naam, kleur)")
```

### Ontbrekend
Het `icoon` veld ontbreekt in de `task_types` join, waardoor `task.task_type.icoon` altijd `undefined` is.

### Bewijs
De database bevat wel iconen:
| Taaktype | Icoon |
|----------|-------|
| Kopen | shopping-cart |
| Te doen | check-square |
| Overleg | users |
| Regelen | settings |
| Opvragen | help-circle |
| Anders | tag |

---

## Technische Wijziging

### Bestand: `src/components/project/ProjectTasksWithDnd.tsx`

**Regel 119 - Aanpassen van de select query:**

Van:
```typescript
.select("*, begindatum, deel_van_huis, type_id, task_type:task_types(id, naam, kleur)")
```

Naar:
```typescript
.select("*, begindatum, deel_van_huis, type_id, task_type:task_types(id, naam, kleur, icoon)")
```

---

## Resultaat
Na deze wijziging zal `task.task_type.icoon` beschikbaar zijn (bijv. `"shopping-cart"`), waardoor de `TaskListView` component het correcte icoon kan renderen via `taskTypeIconMap`.

---

## Bestand te Wijzigen
- `src/components/project/ProjectTasksWithDnd.tsx` (1 regel)
