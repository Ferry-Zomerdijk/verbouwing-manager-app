

# Plan: Confetti animatie bij taak op "Gereed" zetten

## Samenvatting

Wanneer een gebruiker een taak op "Gereed" zet, wordt er een confetti-animatie afgespeeld om de voltooiing te vieren. Dit werkt op alle plekken waar de status kan worden gewijzigd.

---

## Huidige situatie

| Component | Actie |
|-----------|-------|
| `MobileTaskList` | Status dropdown in MobileTaskCard |
| `ProjectTasksWithDnd` | Drag-and-drop naar Gereed kolom |
| `TaskListView` | Status dropdown in tabelrij |
| `TaskBulkActions` | Bulk status wijzigen |

Geen visuele feedback bij voltooien van taken, behalve een toast melding.

---

## Aanpak

Een herbruikbare confetti utility functie aanmaken die vanuit alle status-update locaties kan worden aangeroepen wanneer de nieuwe status "Gereed" is.

### Nieuwe utility: `src/lib/confettiUtils.ts`

```typescript
import confetti from "canvas-confetti";

export const triggerTaskCompletionConfetti = () => {
  // Burst from center
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#10b981", "#f59e0b", "#3b82f6"],
  });
  
  // Side cannons
  confetti({
    particleCount: 30,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: ["#22c55e", "#10b981"],
  });
  confetti({
    particleCount: 30,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: ["#22c55e", "#10b981"],
  });
};
```

---

## Wijzigingen per component

### 1. `MobileTaskList.tsx` (regel 136-138)

In de `onSuccess` callback van `updateTaskStatus`:

```typescript
onSuccess: (_, { taskId, newStatus }) => {
  if (newStatus === "Gereed") {
    triggerTaskCompletionConfetti();
  }
  toast.success(...);
},
```

### 2. `ProjectTasksWithDnd.tsx` (regel 349-351)

In de `onSuccess` callback van `updateTaskStatus`:

```typescript
onSuccess: (_, { taskId, newStatus }) => {
  if (newStatus === "Gereed") {
    triggerTaskCompletionConfetti();
  }
  toast.success("Taak status bijgewerkt");
},
```

### 3. `TaskListView.tsx` (regel 157-159)

In de `onSuccess` callback van `updateTaskMutation`:

```typescript
onSuccess: (data, { taskId, updates }) => {
  if (updates.status === "Gereed") {
    triggerTaskCompletionConfetti();
  }
  toast.success(...);
},
```

### 4. `TaskBulkActions.tsx` (regel 40-43)

In `handleBulkStatusChange` na succesvolle update:

```typescript
toast.success(`Status van ${selectedTaskIds.length} taken bijgewerkt`);
if (status === "Gereed") {
  triggerTaskCompletionConfetti();
}
```

---

## Visueel resultaat

```text
      🎊           🎊
    🎉   🎉     🎉   🎉
         💥
      [ BOOM! ]
         
   ┌─────────────────┐
   │ ✅ Taak titel   │
   │    ► Gereed     │
   └─────────────────┘
```

Confetti kleuren: groen tinten (#22c55e, #10b981) voor "klaar" gevoel, met accenten van oranje en blauw.

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/confettiUtils.ts` | **Nieuw** - Confetti utility functie |
| `src/components/project/MobileTaskList.tsx` | Import + aanroep in onSuccess |
| `src/components/project/ProjectTasksWithDnd.tsx` | Import + aanroep in onSuccess |
| `src/components/project/TaskListView.tsx` | Import + aanroep in onSuccess |
| `src/components/project/TaskBulkActions.tsx` | Import + aanroep na bulk update |

---

## Extra overweging

De confetti wordt alleen getoond wanneer de status daadwerkelijk naar "Gereed" wijzigt (niet als de taak al "Gereed" was). Dit voorkomt onnodig vuurwerk bij duplicaat acties.

