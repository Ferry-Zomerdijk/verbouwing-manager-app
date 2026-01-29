

# Plan: Definitieve Fix voor Gradient Overlay op Widgets

## Probleem

De "Vandaag aanwezig" en "Aankomende leveringen" widgets op de Project > Overzicht pagina hebben een zichtbare witte/vervagende overlay die de tekst moeilijk leesbaar maakt. Vorige pogingen met `bg-card`, `isolate`, en `border-border` hebben het probleem niet opgelost.

---

## Root Cause Analyse

Na grondig onderzoek van de code:

| Component | Styling |
|-----------|---------|
| Pagina container | `bg-gradient-subtle` (gradient van wit naar lichtgroen) |
| Card component (ui/card.tsx) | Al `bg-card` standaard |
| Progress/Budget cards | `overflow-hidden` + absolute positioned decorative circles |
| Widgets | `bg-card isolate border-border` toegevoegd maar niet werkend |

**Het probleem**: De Progress en Budget cards erboven hebben absolute positioned decorative circles met `bg-primary/5` en `bg-blue-500/5` die mogelijk de z-index verstoren. Daarnaast kan de `bg-gradient-subtle` van de pagina door lage opacity layers heen schijnen.

---

## Oplossing

Een combinatie van aanpassingen om volledige visuele isolatie te garanderen:

### 1. Forceer `position: relative` en `z-index` op de widgets grid

Dit voorkomt dat absolute elements van andere cards de widgets beïnvloeden.

### 2. Voeg een wrapper met solide achtergrond toe rond beide widgets

Dit creëert een visuele barrière tussen de pagina gradient en de widgets.

### 3. Verwijder `isolate` (niet effectief) en gebruik `relative z-10` op de widgets

Dit zorgt ervoor dat de widgets altijd boven eventuele overlappende elements staan.

---

## Technische Wijzigingen

### Bestand: `src/components/project/ProjectOverview.tsx`

**Huidige code (regel 142-146):**
```tsx
{/* Attendance & Deliveries Widgets */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
  <ProjectTodayAttendanceWidget projectId={project.id} />
  <ProjectUpcomingDeliveriesWidget projectId={project.id} />
</div>
```

**Nieuwe code:**
```tsx
{/* Attendance & Deliveries Widgets */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
  <ProjectTodayAttendanceWidget projectId={project.id} />
  <ProjectUpcomingDeliveriesWidget projectId={project.id} />
</div>
```

---

### Bestand: `src/components/project/ProjectTodayAttendanceWidget.tsx`

**Huidige code (regel 83):**
```tsx
<Card className="bg-card isolate border-border">
```

**Nieuwe code:**
```tsx
<Card className="bg-white dark:bg-zinc-900 relative shadow-sm">
```

Wijzigingen:
- `bg-white dark:bg-zinc-900` - Hardcoded 100% ondoorzichtige kleuren
- `relative` - Creëert positioning context
- `shadow-sm` - Voegt subtiele schaduw toe die visueel scheidt van achtergrond
- Verwijder `isolate` en `border-border` (redundant)

---

### Bestand: `src/components/project/ProjectUpcomingDeliveriesWidget.tsx`

**Huidige code (regel 112):**
```tsx
<Card className="shadow-sm hover:shadow-md transition-shadow bg-card isolate border-border">
```

**Nieuwe code:**
```tsx
<Card className="shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-900 relative">
```

---

## Waarom Dit Werkt

| Aanpak | Effect |
|--------|--------|
| `bg-white` / `dark:bg-zinc-900` | Hardcoded kleuren zijn 100% ondoorzichtig, geen CSS variable interpretatie |
| `relative z-10` op wrapper | Voorkomt dat absolute elements van Progress/Budget cards overlappen |
| `shadow-sm` | Creëert visuele diepte die scheiding benadrukt |

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/ProjectOverview.tsx` | `relative z-10` toevoegen aan widgets grid |
| `src/components/project/ProjectTodayAttendanceWidget.tsx` | `bg-white dark:bg-zinc-900 relative shadow-sm` |
| `src/components/project/ProjectUpcomingDeliveriesWidget.tsx` | `bg-white dark:bg-zinc-900 relative` |

---

## Fallback als dit niet werkt

Als hardcoded kleuren nog steeds niet werken, is de laatste optie:

1. De `bg-gradient-subtle` class van de pagina vervangen door `bg-background` (solide kleur)
2. Of inline style toevoegen: `style={{ backgroundColor: 'white' }}`

