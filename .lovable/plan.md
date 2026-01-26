
# Plan: Ontbrekende Zoekfuncties en Taaktype Iconen Herstellen

## Probleem
In de huidige `TaskFilters.tsx` ontbreken drie onderdelen die er eerder wel waren:
1. **Algemene zoekbalk** - voor zoeken op titel/beschrijving
2. **Filter op taaktype** - met selecteerbare types
3. **Taaktype iconen** - visuele iconen bij de type-filters

## Analyse

### Huidige Situatie
- De `TaskFiltersType` interface bevat nog wel `search` en `taskTypes` velden (regels 11-22)
- De filterlogica in `ProjectTasksWithDnd.tsx` past deze filters nog correct toe (regels 227-277)
- Echter, de UI-elementen voor deze filters zijn niet meer aanwezig in de render-methode van `TaskFilters.tsx`
- Bij het ophalen van `task_types` ontbreekt het `icoon` veld in de query (regel 158)

### Ontbrekende Onderdelen
| Onderdeel | Status | Locatie |
|-----------|--------|---------|
| Zoekbalk input | Niet gerenderd | `TaskFilters.tsx` |
| Taaktype checkboxes | Niet gerenderd | `TaskFilters.tsx` |
| Iconen in type filter | Ontbreken | `TaskFilters.tsx` + query |

---

## Technische Wijzigingen

### Bestand 1: `src/components/project/TaskFilters.tsx`

#### 1.1 Uitbreiden TaskType Interface
```typescript
interface TaskType {
  id: string;
  naam: string;
  kleur: string;
  icoon: string;  // ← Toevoegen
}
```

#### 1.2 Importeren van icoon utilities
```typescript
import { taskTypeIconMap, getTaskTypeIconColor, DefaultTaskTypeIcon } from "@/lib/taskTypeUtils";
```

#### 1.3 Toevoegen Zoekbalk (bovenaan filter grid)
Een algemene zoekbalk die zoekt op titel en beschrijving:
```typescript
{/* Zoeken */}
<div className="space-y-2 md:col-span-2">
  <Label>Zoeken</Label>
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Zoek op titel of beschrijving..."
      value={filters.search}
      onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
      className="pl-9"
    />
    {filters.search && (
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
        onClick={() => onFiltersChange({ ...filters, search: "" })}
      >
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
</div>
```

#### 1.4 Toevoegen Taaktype Filter (met iconen)
Een sectie met checkboxes voor elk taaktype, inclusief gekleurde iconen:
```typescript
{/* Taaktype */}
{availableTaskTypes.length > 0 && (
  <div className="space-y-2">
    <Label>Taaktype</Label>
    <div className="flex flex-col gap-2">
      {availableTaskTypes.map((taskType) => {
        const IconComponent = taskTypeIconMap[taskType.icoon] || DefaultTaskTypeIcon;
        return (
          <div key={taskType.id} className="flex items-center gap-2">
            <Checkbox
              id={`type-${taskType.id}`}
              checked={filters.taskTypes.includes(taskType.id)}
              onCheckedChange={() => toggleTaskType(taskType.id)}
            />
            <IconComponent className={`h-4 w-4 ${getTaskTypeIconColor(taskType.kleur)}`} />
            <label
              htmlFor={`type-${taskType.id}`}
              className="text-sm cursor-pointer"
            >
              {taskType.naam}
            </label>
          </div>
        );
      })}
    </div>
  </div>
)}
```

#### 1.5 Actieve Filter Chips Uitbreiden
Toevoegen van chips voor actieve zoekterm en geselecteerde taaktypes:
```typescript
{/* Zoekterm chip */}
{filters.search && (
  <Badge 
    variant="secondary" 
    className="gap-1 cursor-pointer hover:bg-secondary/80" 
    onClick={() => onFiltersChange({ ...filters, search: "" })}
  >
    Zoeken: "{filters.search}"
    <X className="w-3 h-3" />
  </Badge>
)}

{/* Taaktype chips */}
{filters.taskTypes.map(typeId => {
  const taskType = availableTaskTypes.find(t => t.id === typeId);
  if (!taskType) return null;
  const IconComponent = taskTypeIconMap[taskType.icoon] || DefaultTaskTypeIcon;
  return (
    <Badge 
      key={typeId}
      variant="secondary" 
      className="gap-1 cursor-pointer hover:bg-secondary/80" 
      onClick={() => toggleTaskType(typeId)}
    >
      <IconComponent className={`h-3 w-3 ${getTaskTypeIconColor(taskType.kleur)}`} />
      {taskType.naam}
      <X className="w-3 h-3" />
    </Badge>
  );
})}
```

---

### Bestand 2: `src/components/project/ProjectTasksWithDnd.tsx`

#### 2.1 Uitbreiden Task Types Query (regel 158)
Het `icoon` veld toevoegen aan de select:
```typescript
// Van:
.select("id, naam, kleur")

// Naar:
.select("id, naam, kleur, icoon")
```

---

## Visueel Resultaat

De filter-sectie zal er als volgt uitzien:

```text
┌─────────────────────────────────────────────────────────┐
│ 🔍 Filters                                   [Reset]  ▼ │
├─────────────────────────────────────────────────────────┤
│ Chips: [Zoeken: "keuken" ✕] [🛒 Kopen ✕] [⚙️ Regelen ✕] │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔍 Zoek op titel of beschrijving...          ✕ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Prioriteit        │  Taaktype                          │
│  ☑ Laag            │  ☑ 🛒 Kopen                        │
│  ☑ Middel          │  ☑ ✓ Te doen                       │
│  ☑ Hoog            │  ☑ 💬 Overleg                      │
│                    │  ☐ 🔧 Regelen                      │
│  Verantwoordelijke │  ☐ ❓ Opvragen                     │
│  [Zoek op naam...] │  ☐ 📋 Anders                       │
│  ...               │                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/TaskFilters.tsx` | Toevoegen zoekbalk, taaktype filter met iconen, actieve filter chips |
| `src/components/project/ProjectTasksWithDnd.tsx` | Uitbreiden task_types query met `icoon` veld |

