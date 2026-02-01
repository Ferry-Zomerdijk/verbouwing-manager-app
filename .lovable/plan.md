

# Plan: Taaktype naam tonen op taakkaart

## Samenvatting

De naam van het taaktype (rubriek) toevoegen aan zowel de desktop TaskCard als de MobileTaskCard. Momenteel wordt alleen het icoon getoond, maar niet de naam zoals "Kopen", "Regelen", of "Overleg".

---

## Huidige situatie vs. gewenste situatie

| Aspect | Huidig | Gewenst |
|--------|--------|---------|
| TaskCard (desktop) | Alleen icoon van taaktype | Icoon + naam als badge |
| MobileTaskCard | Alleen icoon van taaktype | Icoon + naam als badge |
| Visuele stijl | Prioriteit badge is de enige badge | Taaktype badge naast prioriteit |

---

## Beschikbare taaktypes

| Naam | Kleur | Icoon |
|------|-------|-------|
| Kopen | Blauw | shopping-cart |
| Te doen | Oranje | check-square |
| Overleg | Paars | users |
| Regelen | Groen | settings |
| Opvragen | Geel | help-circle |
| Anders | Grijs | tag |

---

## Technische wijzigingen

### 1. Wijziging: `src/components/project/TaskCard.tsx`

**Huidige code (regel 125-138):**
```tsx
<div className="flex flex-wrap items-center gap-2">
  <Badge className={`${priorityColors[task.prioriteit]} text-white text-xs`}>
    {task.prioriteit}
  </Badge>
  {task.task_type && (() => {
    const IconComponent = taskTypeIconMap[task.task_type.icoon] || DefaultTaskTypeIcon;
    return (
      <IconComponent 
        className={`h-4 w-4 ${getTaskTypeIconColor(task.task_type.kleur)}`} 
        aria-label={task.task_type.naam}
      />
    );
  })()}
</div>
```

**Nieuwe code:**
```tsx
<div className="flex flex-wrap items-center gap-2">
  <Badge className={`${priorityColors[task.prioriteit]} text-white text-xs`}>
    {task.prioriteit}
  </Badge>
  {task.task_type && (() => {
    const IconComponent = taskTypeIconMap[task.task_type.icoon] || DefaultTaskTypeIcon;
    return (
      <Badge 
        variant="outline" 
        className={`text-xs gap-1 ${getTaskTypeIconColor(task.task_type.kleur)}`}
      >
        <IconComponent className="h-3 w-3" />
        {task.task_type.naam}
      </Badge>
    );
  })()}
</div>
```

**Wijzigingen:**
- Taaktype icoon + naam samen in een outline badge
- Badge neemt de kleur over van het taaktype (text color)
- Icoon verkleind naar 3x3 om in badge te passen

---

### 2. Wijziging: `src/components/project/MobileTaskCard.tsx`

**Huidige code (regel 121-136):**
```tsx
{/* Header row: Priority badge, Type badge & Status selector */}
<div className="flex items-center justify-between mb-3">
  <div className="flex items-center gap-2">
    <Badge className={`${priorityConfig[priority]?.color || "bg-muted"} text-white text-xs px-3 py-1`}>
      {task.prioriteit || "Geen"}
    </Badge>
    {task.task_type && (() => {
      const IconComponent = taskTypeIconMap[task.task_type.icoon] || DefaultTaskTypeIcon;
      return (
        <IconComponent 
          className={`h-5 w-5 ${getTaskTypeIconColor(task.task_type.kleur)}`} 
          aria-label={task.task_type.naam}
        />
      );
    })()}
  </div>
  ...
</div>
```

**Nieuwe code:**
```tsx
{/* Header row: Priority badge, Type badge & Status selector */}
<div className="flex items-center justify-between mb-3">
  <div className="flex items-center gap-2 flex-wrap">
    <Badge className={`${priorityConfig[priority]?.color || "bg-muted"} text-white text-xs px-3 py-1`}>
      {task.prioriteit || "Geen"}
    </Badge>
    {task.task_type && (() => {
      const IconComponent = taskTypeIconMap[task.task_type.icoon] || DefaultTaskTypeIcon;
      return (
        <Badge 
          variant="outline" 
          className={`text-xs gap-1 px-2 py-1 ${getTaskTypeIconColor(task.task_type.kleur)}`}
        >
          <IconComponent className="h-3.5 w-3.5" />
          {task.task_type.naam}
        </Badge>
      );
    })()}
  </div>
  ...
</div>
```

**Wijzigingen:**
- Taaktype icoon + naam samen in een outline badge
- `flex-wrap` toegevoegd aan container voor smalle schermen
- Badge met wat grotere icoon (3.5x3.5) voor mobile leesbaarheid

---

### 3. Helper functie uitbreiden: `src/lib/taskTypeUtils.ts`

**Optioneel**: Voeg een helper toe voor badge achtergrondkleuren (als we gevulde badges willen i.p.v. outline):

```tsx
export const getTaskTypeBadgeClass = (kleur: string | null): string => {
  const colorMap: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    green: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
    yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    gray: "border-gray-500/30 bg-gray-500/10 text-gray-600 dark:text-gray-400",
    red: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    pink: "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  };
  return colorMap[kleur || "gray"] || colorMap.gray;
};
```

---

## Visueel resultaat

**Desktop TaskCard:**
```text
┌──────────────────────────────────────┐
│ Taaktitel hier                  [···]│
│ Beschrijving van de taak...          │
│                                      │
│ [Hoog] [🛒 Kopen]                    │
│ 📅 15 feb 2026                       │
│ 👤 Jan                               │
└──────────────────────────────────────┘
```

**Mobile TaskCard:**
```text
┌──────────────────────────────────────┐
│ [Hoog] [🛒 Kopen]          [Bezig ▾] │
│                                      │
│ Taaktitel hier                   [▾] │
│ 📅 15 feb 2026    👤 Jan             │
└──────────────────────────────────────┘
```

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/TaskCard.tsx` | Taaktype badge met icoon + naam |
| `src/components/project/MobileTaskCard.tsx` | Taaktype badge met icoon + naam |
| `src/lib/taskTypeUtils.ts` | Nieuwe helper `getTaskTypeBadgeClass` |

---

## Randgevallen

- Als `task.task_type` null is: geen badge tonen (bestaand gedrag)
- Lange namen: badges worden automatisch afgekapt door flex-wrap
- Dark mode: kleuren schalen correct mee via `dark:` prefix

