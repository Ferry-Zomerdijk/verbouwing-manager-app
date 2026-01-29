

# Plan: Gradient Layer Fix voor Vandaag Aanwezig Widget

## Probleem

De "Vandaag aanwezig" widget heeft een zichtbare witte/vervagende overlay die de tekst moeilijk leesbaar maakt. De vorige fix (verwijderen van `overflow-hidden`) heeft het probleem niet opgelost.

---

## Analyse

Na uitgebreid onderzoek blijkt:

| Bevinding | Details |
|-----------|---------|
| Pagina achtergrond | `bg-gradient-subtle` - verticale gradient van wit naar licht groen |
| Card achtergrond | `bg-card` (wit) via Card component |
| CardContent | Geen expliciete achtergrond |

Het probleem kan worden veroorzaakt door:
1. Browser rendering van gestapelde semi-transparante elementen
2. De `border` styling van de Card in combinatie met de gradient achtergrond
3. Ontbrekende expliciete achtergrondkleur op CardContent waardoor de gradient doorschijnt

---

## Oplossing

Voeg een expliciete `bg-card` achtergrondkleur toe aan de `CardContent` en/of de Card zelf om te zorgen dat de achtergrond volledig dekkend is.

---

## Technische Wijzigingen

### 1. TodayAttendanceWidget.tsx

**CardContent aanpassen (regel 115):**

Van:
```tsx
<CardContent className="pt-2">
```

Naar:
```tsx
<CardContent className="pt-2 bg-card">
```

**CardHeader aanpassen (regel 99):**

Van:
```tsx
<CardHeader className="pb-2">
```

Naar:
```tsx
<CardHeader className="pb-2 bg-card rounded-t-lg">
```

---

### 2. ProjectTodayAttendanceWidget.tsx

**Zelfde wijzigingen toepassen:**

CardContent (regel 100):
```tsx
<CardContent className="pt-2 bg-card">
```

CardHeader (regel 84):
```tsx
<CardHeader className="pb-2 bg-card rounded-t-lg">
```

---

## Alternatieve Oplossing

Als bovenstaande niet werkt, voeg isolatie toe aan de Card zelf:

```tsx
<Card className="isolation-auto">
```

Of forceer een volledige dekkende achtergrond:

```tsx
<Card className="bg-white dark:bg-card">
```

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/TodayAttendanceWidget.tsx` | `bg-card` toevoegen aan CardHeader en CardContent |
| `src/components/project/ProjectTodayAttendanceWidget.tsx` | Zelfde aanpassingen |

---

## Waarom Dit Werkt

Door expliciet `bg-card` toe te voegen aan zowel CardHeader als CardContent, zorgen we ervoor dat:

1. De gehele card een solide, ondoorzichtige achtergrond heeft
2. Geen gradient van de pagina doorschijnt
3. De rounded corners correct worden toegepast met `rounded-t-lg` op de header

