
# Plan: Tooltips, Kanban Iconen en Status Filter

## Overzicht

Dit plan implementeert drie verbeteringen aan de takenweergave:

1. **Tooltips bij taaktype iconen in lijstweergave** - Reeds geïmplementeerd! ✅
2. **Taaktype icoon in Kanban kaarten** - Reeds geïmplementeerd! ✅  
3. **Status filter toevoegen aan Filters panel** - Moet nog worden geïmplementeerd

---

## Analyse van Huidige Situatie

### 1. Tooltips in Lijstweergave
**Status: Al geïmplementeerd** ✅

In `TaskListView.tsx` (regels 478-501) worden tooltips al correct getoond:
```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex items-center justify-center">
        <IconComponent className={`h-5 w-5 ${getTaskTypeIconColor(task.task_type.kleur)}`} />
      </span>
    </TooltipTrigger>
    <TooltipContent>
      {task.task_type.naam}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 2. Iconen in Kanban Kaarten
**Status: Al geïmplementeerd** ✅

In `TaskCard.tsx` (regels 129-137) worden iconen al getoond:
```typescript
{task.task_type && (() => {
  const IconComponent = taskTypeIconMap[task.task_type.icoon] || DefaultTaskTypeIcon;
  return (
    <IconComponent 
      className={`h-4 w-4 ${getTaskTypeIconColor(task.task_type.kleur)}`} 
      aria-label={task.task_type.naam}
    />
  );
})()}
```

### 3. Status Filter
**Status: Ontbreekt in de UI** ❌

De filterlogica bestaat al (`filters.statuses`, `toggleStatus` functie), maar de UI-checkboxes om statussen te selecteren zijn niet zichtbaar in het filter panel.

---

## Technische Wijzigingen

### Bestand: `src/components/project/TaskFilters.tsx`

#### Toevoegen Status Filter Sectie
Na de Prioriteit sectie (regel 277) een nieuwe sectie toevoegen voor Status filtering:

```typescript
{/* Status */}
<div className="space-y-2">
  <Label>Status</Label>
  <div className="flex flex-col gap-2">
    {ALL_STATUSES.map((status) => (
      <div key={status} className="flex items-center gap-2">
        <Checkbox
          id={`status-${status}`}
          checked={filters.statuses.includes(status)}
          onCheckedChange={() => toggleStatus(status)}
        />
        <label
          htmlFor={`status-${status}`}
          className="text-sm cursor-pointer"
        >
          {status}
        </label>
      </div>
    ))}
  </div>
</div>
```

#### Toevoegen Status Chips bij Actieve Filters
Na de prioriteit chips (rond regel 182) ook chips tonen voor uitgesloten statussen:

```typescript
{/* Status chips - toon alleen uitgesloten statussen */}
{ALL_STATUSES.filter(s => !filters.statuses.includes(s)).map(excludedStatus => (
  <Badge 
    key={`status-${excludedStatus}`} 
    variant="secondary" 
    className="gap-1 cursor-pointer hover:bg-secondary/80" 
    onClick={() => toggleStatus(excludedStatus)}
  >
    Zonder: {excludedStatus}
    <X className="w-3 h-3" />
  </Badge>
))}
```

---

## Visueel Resultaat

Het filter panel zal er als volgt uitzien:

```text
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Filters                                        [Reset]  ▼   │
├─────────────────────────────────────────────────────────────────┤
│ Chips: [Zonder: Gereed ✕] [Zonder: Hoog ✕] [🛒 Kopen ✕]         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🔍 Zoek op titel of beschrijving...                  ✕ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Prioriteit        │  Status           │  Taaktype              │
│  ☑ Laag            │  ☑ Te doen        │  ☑ 🛒 Kopen            │
│  ☑ Middel          │  ☑ Bezig          │  ☑ ✓ Te doen           │
│  ☑ Hoog            │  ☐ Gereed         │  ☑ 💬 Overleg          │
│                    │                   │  ...                   │
│                                                                 │
│  Verantwoordelijke │  Deel van huis                             │
│  [Zoek op naam...] │  [Zoek locatie...]                         │
│  ...               │                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Samenvatting Wijzigingen

| Onderdeel | Status | Actie |
|-----------|--------|-------|
| Tooltips bij taaktype iconen | ✅ Werkt | Geen wijziging nodig |
| Iconen in Kanban kaarten | ✅ Werkt | Geen wijziging nodig |
| Status filter UI | ❌ Ontbreekt | Checkboxes + chips toevoegen |

### Bestand te Wijzigen
- `src/components/project/TaskFilters.tsx`
  - Status checkboxes toevoegen in grid (na Prioriteit)
  - Status chips toevoegen bij actieve filters
