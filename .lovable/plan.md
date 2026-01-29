

# Plan: Gradient Overlay Definitief Oplossen voor Aanwezigheid Widget

## Probleem

De "Vandaag aanwezig" widget op de Project > Overzicht pagina heeft een zichtbare witte/vervagende overlay die de groene badges met namen en tijden moeilijk leesbaar maakt.

De vorige fixes (verwijderen `overflow-hidden` en toevoegen `bg-card`) hebben het probleem **niet** opgelost.

---

## Diagnose

Na analyse van de code en CSS variabelen:

| Component | Achtergrond |
|-----------|-------------|
| Pagina (`ProjectDetail.tsx`) | `bg-gradient-subtle` - gradient van wit naar licht groen |
| Card component | `bg-card` (hsl `0 0% 100%` = wit) |
| CardHeader/Content | Toegevoegd `bg-card` - maar dit lost het niet op |

**Root cause**: De `Card` component heeft een `border` met lage opacity (`border-border/50` of standaard border) en de combinatie van gestapelde layers op een gradient achtergrond kan visuele artefacten creëren door browser rendering.

---

## Oplossing

Forceer een **volledig ondoorzichtige achtergrond** op de Card zelf met een expliciete hardcoded kleur:

1. Voeg `bg-white dark:bg-zinc-900` toe aan de Card component in `ProjectTodayAttendanceWidget.tsx`
2. Dit overschrijft de CSS variabele en voorkomt elke vorm van transparantie of gradient doorschijn
3. Voeg ook `isolate` toe om een nieuwe stacking context te creëren

---

## Technische Wijzigingen

### Bestand: `src/components/project/ProjectTodayAttendanceWidget.tsx`

**Huidige code (regel 83):**
```tsx
<Card>
```

**Nieuwe code:**
```tsx
<Card className="bg-white dark:bg-zinc-900 isolate">
```

**Verwijder overbodige bg-card van CardHeader en CardContent:**

CardHeader (regel 84):
```tsx
<CardHeader className="pb-2">
```

CardContent (regel 100):
```tsx
<CardContent className="pt-2">
```

---

### Bestand: `src/components/project/ProjectUpcomingDeliveriesWidget.tsx`

Pas dezelfde fix toe voor consistentie:

**Huidige code (regel 112):**
```tsx
<Card className="shadow-sm hover:shadow-md transition-shadow">
```

**Nieuwe code:**
```tsx
<Card className="shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-900 isolate">
```

---

## Waarom Dit Werkt

| Aanpak | Effect |
|--------|--------|
| `bg-white` | Forceert 100% ondoorzichtige witte achtergrond in light mode |
| `dark:bg-zinc-900` | Forceert ondoorzichtige donkere achtergrond in dark mode |
| `isolate` | Creëert nieuwe stacking context, voorkomt blend-through effecten |

Door de CSS variabele `hsl(var(--card))` te vervangen door hardcoded kleuren, elimineren we elke mogelijke transparantie of rendering artifact.

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/ProjectTodayAttendanceWidget.tsx` | Card: `bg-white dark:bg-zinc-900 isolate` |
| `src/components/project/ProjectUpcomingDeliveriesWidget.tsx` | Zelfde fix voor consistentie |

---

## Alternatief als dit niet werkt

Als hardcoded kleuren ook niet werken, is er mogelijk een browser-specifieke rendering issue. Dan zouden we:

1. De gradient achtergrond van de pagina moeten aanpassen
2. Of een wrapper div met solide achtergrond rond de widgets plaatsen

