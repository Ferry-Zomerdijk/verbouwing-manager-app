
# Plan: Iconen consistent tonen voor taaktypes

## Probleem

In de gepubliceerde versie worden `...` (drie puntjes/MoreHorizontal) iconen getoond in plaats van de juiste taaktype iconen. Dit gebeurt op meerdere plekken in de applicatie.

---

## Oorzaak analyse

Het probleem heeft **twee hoofdoorzaken**:

### 1. Nieuwe taaktypes krijgen geen icoon

In `TaskTypesManager.tsx` wordt bij het aanmaken van nieuwe taaktypes geen `icoon` veld meegestuurd:

```tsx
// Huidige code (regel 82-87)
.insert({
  naam,
  kleur,
  volgorde: maxVolgorde + 1,
  is_systeem: false,
  // ONTBREEKT: icoon veld!
});
```

Hierdoor krijgen nieuwe taaktypes `icoon = NULL` en valt de UI terug naar `DefaultTaskTypeIcon` (MoreHorizontal = `...`).

### 2. Inconsistente queries - icoon veld niet opgehaald

Verschillende componenten halen het `icoon` veld niet op:

| Bestand | Query | Probleem |
|---------|-------|----------|
| `CreateTaskDialog.tsx` | `select("id, naam, kleur")` | Mist `icoon` |
| `EditTaskDialog.tsx` | `select("id, naam, kleur")` | Mist `icoon` |
| `MobileTaskWizard.tsx` | `select("id, naam, kleur")` | Mist `icoon` |
| `ProjectTasksWithDnd.tsx` | `select("id, naam, kleur, icoon")` | ✓ Correct |

---

## Oplossing

### Stap 1: TaskTypesManager - Standaard icoon toevoegen

Bij het aanmaken van een nieuw taaktype wordt automatisch een standaard icoon (`tag`) toegevoegd:

```tsx
.insert({
  naam,
  kleur,
  volgorde: maxVolgorde + 1,
  is_systeem: false,
  icoon: "tag",  // Standaard icoon voor nieuwe types
});
```

### Stap 2: TaskTypesManager - Icoon selector toevoegen (optioneel, aanbevolen)

Voeg een dropdown toe waarmee admins een icoon kunnen kiezen uit de beschikbare iconen:

**Beschikbare iconen:**
- `shopping-cart` → ShoppingBag (Kopen/Inkoop)
- `check-square` → ListTodo (Te doen/Taken)
- `users` → MessageCircle (Overleg/Communicatie)
- `settings` → Wrench (Regelen/Praktisch)
- `help-circle` → Search (Opvragen/Informatie)
- `tag` → MoreHorizontal (Anders/Overig)

### Stap 3: Queries uitbreiden met icoon veld

Voeg `icoon` toe aan alle task_types queries:

**CreateTaskDialog.tsx:**
```tsx
.select("id, naam, kleur, icoon")
```

**EditTaskDialog.tsx:**
```tsx
.select("id, naam, kleur, icoon")
```

**MobileTaskWizard.tsx:**
```tsx
.select("id, naam, kleur, icoon")
```

### Stap 4: Dialogs - Iconen tonen in selector

Vervang de gekleurde cirkels door iconen in de taaktype dropdown:

```tsx
{taskTypes.map((type) => {
  const IconComponent = taskTypeIconMap[type.icoon] || DefaultTaskTypeIcon;
  return (
    <SelectItem key={type.id} value={type.id}>
      <div className="flex items-center gap-2">
        <IconComponent className={`h-4 w-4 ${getTaskTypeIconColor(type.kleur)}`} />
        {type.naam}
      </div>
    </SelectItem>
  );
})}
```

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/admin/TaskTypesManager.tsx` | Standaard icoon bij insert + icoon selector UI |
| `src/components/project/CreateTaskDialog.tsx` | Query uitbreiden + iconen in dropdown |
| `src/components/project/EditTaskDialog.tsx` | Query uitbreiden + iconen in dropdown |
| `src/components/project/MobileTaskWizard.tsx` | Query uitbreiden + iconen in dropdown |

---

## Visueel resultaat

**Vóór (huidige situatie):**
```text
Taaktype
○ ... Kopen
○ ... Te doen
○ ... Overleg
```

**Na (na implementatie):**
```text
Taaktype
○ 🛒 Kopen
○ ☑️ Te doen
○ 💬 Overleg
```

---

## Database bestaande data

De bestaande 6 systeemtaaktypes hebben al correcte icoon waarden:

| Naam | Icoon | Status |
|------|-------|--------|
| Kopen | `shopping-cart` | ✓ OK |
| Te doen | `check-square` | ✓ OK |
| Overleg | `users` | ✓ OK |
| Regelen | `settings` | ✓ OK |
| Opvragen | `help-circle` | ✓ OK |
| Anders | `tag` | ✓ OK |

Geen database migratie nodig - alleen code wijzigingen.
