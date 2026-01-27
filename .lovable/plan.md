
# Plan: Verwachte Leverdatum voor "Kopen" Taken

## Overzicht

Dit plan voegt een optioneel veld "Verwachte leverdatum" toe aan taken met het taaktype "Kopen". Dit veld wordt:
1. **Alleen getoond** in formulieren wanneer het taaktype "Kopen" is geselecteerd
2. **In de tabelweergave** getoond onder de taaktitel (net als de beschrijving)
3. **In de mobiele weergave** getoond bij relevante taken

---

## Huidige Situatie

| Onderdeel | Status |
|-----------|--------|
| Database `tasks` tabel | Heeft geen `verwachte_leverdatum` kolom |
| Taaktype "Kopen" | ID: `625a9cdc-6db9-4671-b4d1-086efe4a7552`, icoon: `shopping-cart` |
| TaskListView | Toont beschrijving onder titel (regel 511-515) |
| CreateTaskDialog | Desktop formulier voor taak aanmaken |
| EditTaskDialog | Desktop/mobiel formulier voor taak bewerken |
| MobileTaskWizard | Mobiele wizard voor taak aanmaken |
| MobileTaskCard | Mobiele taakkaart weergave |

---

## Technische Wijzigingen

### 1. Database Migratie

**Nieuw veld toevoegen aan `tasks` tabel:**

```sql
ALTER TABLE tasks 
ADD COLUMN verwachte_leverdatum date NULL;
```

---

### 2. CreateTaskDialog.tsx

**FormData state uitbreiden:**

```typescript
const [formData, setFormData] = useState({
  // ... bestaande velden
  verwachte_leverdatum: "",
});
```

**Conditioneel veld tonen wanneer type "Kopen" is:**

```tsx
{/* Toon alleen wanneer type_id == Kopen type ID */}
{selectedTaskType?.naam === "Kopen" && (
  <div className="space-y-2">
    <Label>Verwachte leverdatum</Label>
    <DatePicker
      value={formData.verwachte_leverdatum}
      onChange={(value) => setFormData({ ...formData, verwachte_leverdatum: value })}
      placeholder="Optioneel"
    />
  </div>
)}
```

**Bij submit meesturen:**

```typescript
verwachte_leverdatum: formData.verwachte_leverdatum || null,
```

---

### 3. EditTaskDialog.tsx

**Zelfde aanpassingen als CreateTaskDialog:**
- FormData uitbreiden met `verwachte_leverdatum`
- Conditioneel DatePicker tonen wanneer type "Kopen" is
- Bij submit meesturen

---

### 4. MobileTaskWizard.tsx

**In stap 2 (Planning) conditioneel veld tonen:**

```tsx
{selectedTaskType?.naam === "Kopen" && (
  <div className="space-y-3">
    <Label className="text-base font-medium">Verwachte leverdatum</Label>
    <input
      type="date"
      value={formData.verwachte_leverdatum}
      onChange={(e) => setFormData(prev => ({ ...prev, verwachte_leverdatum: e.target.value }))}
      className="w-full h-12 px-4 border rounded-lg text-base"
    />
  </div>
)}
```

---

### 5. TaskListView.tsx

**Interface Task uitbreiden:**

```typescript
interface Task {
  // ... bestaande velden
  verwachte_leverdatum: string | null;
}
```

**Onder titel cel (naast beschrijving):**

```tsx
<TableCell className="font-medium max-w-xs">
  <div className="flex flex-col gap-0.5">
    <button onClick={() => setEditTask({ ...task })} className="text-left font-medium hover:underline">
      {task.titel}
    </button>
    {task.beschrijving && (
      <span className="text-sm text-gray-500 line-clamp-2">
        {task.beschrijving}
      </span>
    )}
    {/* Nieuwe regel: Verwachte leverdatum voor Kopen taken */}
    {task.task_type?.icoon === "shopping-cart" && task.verwachte_leverdatum && (
      <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
        <Package className="w-3 h-3" />
        Levering: {format(new Date(task.verwachte_leverdatum), "d MMM yyyy", { locale: nl })}
      </span>
    )}
  </div>
</TableCell>
```

---

### 6. MobileTaskCard.tsx

**In de kaart onder deadline/verantwoordelijke grid:**

```tsx
{/* Verwachte leverdatum voor Kopen taken */}
{task.task_type?.icoon === "shopping-cart" && task.verwachte_leverdatum && (
  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-2">
    <Package className="w-4 h-4 shrink-0" />
    <span>Levering: {format(new Date(task.verwachte_leverdatum), "d MMM yyyy", { locale: nl })}</span>
  </div>
)}
```

---

### 7. ProjectTasksWithDnd.tsx

**Query uitbreiden om `verwachte_leverdatum` op te halen:**

```typescript
.select("*, begindatum, deel_van_huis, type_id, verwachte_leverdatum, task_type:task_types(id, naam, kleur, icoon)")
```

---

## Visueel Resultaat

### Formulier (wanneer type = Kopen):

```text
┌─────────────────────────────────────┐
│ Type taak                           │
│ [🛒 Kopen ▼]                        │
├─────────────────────────────────────┤
│ Verwachte leverdatum (optioneel)    │
│ [📅 dd-mm-jjjj              ]       │
└─────────────────────────────────────┘
```

### Tabelweergave:

```text
┌────────┬────────┬──────┬─────┬──────────────────────────────────┐
│ Begin  │Deadline│Status│Type │ Titel                            │
├────────┼────────┼──────┼─────┼──────────────────────────────────┤
│10 jan  │15 jan  │Bezig │ 🛒  │ Dakpannen bestellen              │
│        │        │      │     │ Rode pannen voor garage          │
│        │        │      │     │ 📦 Levering: 20 jan 2026         │
├────────┼────────┼──────┼─────┼──────────────────────────────────┤
│12 jan  │18 jan  │Te do │ ✓   │ Elektra aanleggen                │
│        │        │      │     │ Stopcontacten plaatsen           │
└────────┴────────┴──────┴─────┴──────────────────────────────────┘
```

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | Nieuw veld `verwachte_leverdatum` aan `tasks` tabel |
| `src/integrations/supabase/types.ts` | Type definitie uitbreiden |
| `src/components/project/CreateTaskDialog.tsx` | Conditioneel datumveld toevoegen |
| `src/components/project/EditTaskDialog.tsx` | Conditioneel datumveld toevoegen |
| `src/components/project/MobileTaskWizard.tsx` | Conditioneel datumveld in wizard |
| `src/components/project/TaskListView.tsx` | Leverdatum tonen onder titel |
| `src/components/project/MobileTaskCard.tsx` | Leverdatum tonen in kaart |
| `src/components/project/ProjectTasksWithDnd.tsx` | Query uitbreiden met nieuw veld |
| `src/lib/excelImport.ts` | Optioneel: export ondersteuning |

---

## Edge Cases

1. **Type wijzigen van "Kopen" naar ander type**: De leverdatum blijft bewaard in de database maar wordt niet meer getoond
2. **Type wijzigen naar "Kopen"**: Het veld verschijnt en kan alsnog worden ingevuld
3. **Offline mode**: Werkt via bestaande offline queue mechanisme

