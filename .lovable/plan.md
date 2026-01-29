

# Plan: Widgets Toevoegen aan Project Overzicht

## Overzicht

De "Overzicht" pagina binnen een project wordt aangepast om dezelfde widgets te tonen als het dashboard:
- **Vandaag aanwezig** - Toont wie er vandaag aanwezig is (project-specifiek)
- **Aankomende leveringen** - Toont geplande leveringen (project-specifiek)

De bestaande **Startdatum** en **Status** widgets worden vervangen.

---

## Huidige Situatie

| Widget | Status |
|--------|--------|
| Voortgang | Behouden |
| Budget | Behouden (alleen voor admin/owner) |
| Startdatum | Wordt vervangen |
| Status | Wordt vervangen |
| Wijsheid van de dag | Behouden |
| Recente taakactiviteit | Behouden |

---

## Technische Wijzigingen

### 1. Nieuwe Widget: ProjectTodayAttendanceWidget

**Nieuw bestand:** `src/components/project/ProjectTodayAttendanceWidget.tsx`

Dit is een project-specifieke versie van `TodayAttendanceWidget.tsx`:
- Filtert op `project_id` in plaats van alle projecten te tonen
- Accepteert `projectId` als prop
- Toont alleen aanwezigen voor dit specifieke project
- Verwijdert de projectnaam uit de weergave (niet nodig binnen projectcontext)

```typescript
interface ProjectTodayAttendanceWidgetProps {
  projectId: string;
}
```

---

### 2. Nieuwe Widget: ProjectUpcomingDeliveriesWidget

**Nieuw bestand:** `src/components/project/ProjectUpcomingDeliveriesWidget.tsx`

Dit is een project-specifieke versie van `UpcomingDeliveriesWidget.tsx`:
- Filtert op `project_id` in plaats van alle projecten te tonen
- Accepteert `projectId` als prop
- Verwijdert de projectnaam uit de weergave
- Behoudt alle bestaande functionaliteit (achterstallig markering, navigatie naar taak)

```typescript
interface ProjectUpcomingDeliveriesWidgetProps {
  projectId: string;
}
```

---

### 3. Aanpassen ProjectOverview.tsx

**Wijzigingen:**

1. **Imports toevoegen:**
   ```typescript
   import ProjectTodayAttendanceWidget from "./ProjectTodayAttendanceWidget";
   import ProjectUpcomingDeliveriesWidget from "./ProjectUpcomingDeliveriesWidget";
   ```

2. **Grid aanpassen (regels 84-203):**
   - Verwijder de "Startdatum" Card (regels 142-164)
   - Verwijder de "Status" Card (regels 166-202)
   - Grid wijzigen naar 2 kolommen voor stat cards

3. **Nieuwe widgets sectie toevoegen:**
   Na de stats grid en voor de "Wijsheid" card:
   ```tsx
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
     <ProjectTodayAttendanceWidget projectId={project.id} />
     <ProjectUpcomingDeliveriesWidget projectId={project.id} />
   </div>
   ```

---

## Nieuwe Layout

```text
┌─────────────────────────────────────────────────────────────┐
│  STATS GRID (2 kolommen)                                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ 📈 Voortgang        │  │ 💰 Budget           │           │
│  │ 45%                 │  │ €12.500             │           │
│  │ 9 van 20 taken      │  │ van €25.000         │           │
│  └─────────────────────┘  └─────────────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  WIDGETS GRID (2 kolommen)                                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ 👥 Vandaag aanwezig │  │ 📦 Aankomende       │           │
│  │ 3 personen          │  │    leveringen       │           │
│  │ • Jan 07:30-16:00   │  │ • Dakpannen  Vandaag│           │
│  │ • Piet 08:00-17:00  │  │ • Kozijnen   Morgen │           │
│  │ • Klaas 09:00-15:00 │  │ • Verf      Vrijdag │           │
│  └─────────────────────┘  └─────────────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  💡 Wijsheid van de dag                                     │
│  "Een goede voorbereiding is het halve werk"                │
├─────────────────────────────────────────────────────────────┤
│  📋 Recente taakactiviteit                                  │
│  • Jan heeft taak X afgerond                                │
│  • Piet heeft taak Y geüpdatet                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Bestanden te Maken/Wijzigen

| Bestand | Actie |
|---------|-------|
| `src/components/project/ProjectTodayAttendanceWidget.tsx` | Nieuw |
| `src/components/project/ProjectUpcomingDeliveriesWidget.tsx` | Nieuw |
| `src/components/project/ProjectOverview.tsx` | Wijzigen |

---

## Details per Widget

### ProjectTodayAttendanceWidget

Aangepaste versie van TodayAttendanceWidget:
- Query filtert op `project_id`
- Geen project-groupering nodig (al binnen 1 project)
- Directe lijst van aanwezige contractors
- Klik navigeert naar aanwezigheidstab

### ProjectUpcomingDeliveriesWidget

Aangepaste versie van UpcomingDeliveriesWidget:
- Query filtert op `project_id`
- Geen projectnaam weergave (overbodig)
- Behoudt achterstallig markering en datum labels
- Klik navigeert naar taakdetails (`?task=id`)

