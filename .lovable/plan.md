
# Plan: Snelle Link naar Taak Details

## Overzicht

De leveringen widget wordt aangepast zodat bij klikken direct de taakdetails worden geopend in plaats van alleen naar het project te navigeren.

---

## Huidige Situatie

| Onderdeel | Status |
|-----------|--------|
| Widget click handler | Navigeert naar `/project/{project_id}` |
| Taakdetails | Worden geopend via EditTaskDialog binnen ProjectTasksWithDnd |
| URL-ondersteuning voor taken | Niet aanwezig |

---

## Oplossing

Navigeer naar het project met een query parameter `?task={task_id}`, en laat `ProjectTasksWithDnd` automatisch de EditTaskDialog openen voor die taak.

---

## Technische Wijzigingen

### 1. UpcomingDeliveriesWidget.tsx

**Navigatie aanpassen (regel 110):**

Van:
```typescript
onClick={() => navigate(`/project/${delivery.project_id}`)}
```

Naar:
```typescript
onClick={() => navigate(`/project/${delivery.project_id}?task=${delivery.id}`)}
```

---

### 2. ProjectTasksWithDnd.tsx

**Imports toevoegen:**

```typescript
import { useSearchParams } from "react-router-dom";
import EditTaskDialog from "./EditTaskDialog";
```

**State en effect toevoegen:**

```typescript
const [searchParams, setSearchParams] = useSearchParams();
const [editTask, setEditTask] = useState<any>(null);

// Auto-open task from URL parameter
useEffect(() => {
  const taskId = searchParams.get('task');
  if (taskId && displayTasks) {
    const task = displayTasks.find(t => t.id === taskId);
    if (task) {
      setEditTask(task);
      // Clear the parameter from URL
      searchParams.delete('task');
      setSearchParams(searchParams, { replace: true });
    }
  }
}, [searchParams, displayTasks]);
```

**EditTaskDialog toevoegen aan component return:**

```tsx
{editTask && (
  <EditTaskDialog
    task={editTask}
    open={!!editTask}
    onOpenChange={(open) => !open && setEditTask(null)}
    onUpdate={() => {
      refetch();
      setEditTask(null);
    }}
  />
)}
```

---

## Flow Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                 Dashboard                                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐                │
│  │ 📦 Aankomende leveringen                │                │
│  ├─────────────────────────────────────────┤                │
│  │ Dakpannen bestellen          Vandaag →  │ ◄── Klik       │
│  │ Project Garage               27 jan     │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Navigate: /project/abc123?task=xyz789                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               Project Detail (Taken tab)                     │
├─────────────────────────────────────────────────────────────┤
│                                      ┌────────────────────┐ │
│  ┌──────────────────────────────┐    │ EditTaskDialog     │ │
│  │ Taken lijst                  │    │ (auto-geopend)     │ │
│  │ • Dakpannen bestellen ←─────────┤ │                    │ │
│  │ • Isolatie plaatsen          │    │ Titel: Dakpannen   │ │
│  │ • Kozijnen monteren          │    │ Status: Te doen    │ │
│  └──────────────────────────────┘    │ Levering: 27 jan   │ │
│                                      └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/UpcomingDeliveriesWidget.tsx` | Query parameter `?task=` toevoegen aan navigatie |
| `src/components/project/ProjectTasksWithDnd.tsx` | useSearchParams toevoegen, EditTaskDialog state, auto-open effect |

---

## Voordelen

1. **Directe toegang**: Gebruiker komt direct bij de taakdetails
2. **Context behouden**: Gebruiker blijft in het project en kan andere taken bekijken
3. **Deelbare links**: URLs met `?task=` parameter kunnen worden gedeeld
4. **Bestaande patronen**: Gebruikt de bestaande EditTaskDialog component
