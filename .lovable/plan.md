

# Plan: Gradient Layer Verwijderen van Vandaag Aanwezig Widget

## Probleem

De "Vandaag aanwezig" widget op het dashboard heeft een zichtbare witte vervagende overlay/gradient aan de onderkant, waardoor de tekst en badges (zoals "Arjan Beemsterboer 07:30-16:30") moeilijk leesbaar zijn.

---

## Analyse

Na onderzoek van de code blijkt dat de `TodayAttendanceWidget` zelf geen expliciete gradient heeft. Het probleem lijkt te komen van:

1. De `overflow-hidden` class op de Card component
2. Mogelijke interactie met de `bg-gradient-subtle` achtergrond van de pagina
3. Browser rendering van de border-radius in combinatie met overflow

---

## Oplossing

Verwijder `overflow-hidden` van de Card of voeg expliciet een solide achtergrondkleur toe aan de CardContent om het gradient-doorschijn effect te blokkeren.

---

## Technische Wijziging

### Bestand: `src/components/TodayAttendanceWidget.tsx`

**Optie 1 - Verwijder overflow-hidden (regel 98):**

Van:
```tsx
<Card className="overflow-hidden">
```

Naar:
```tsx
<Card>
```

**Optie 2 - Voeg achtergrondkleur toe aan CardContent (regel 115):**

Van:
```tsx
<CardContent className="pt-2">
```

Naar:
```tsx
<CardContent className="pt-2 bg-card">
```

---

## Waarom dit werkt

| Probleem | Oplossing |
|----------|-----------|
| `overflow-hidden` kan visuele artefacten veroorzaken bij afgeronde hoeken | Verwijderen lost rendering issue op |
| Gradient van achtergrond schijnt door | Expliciete `bg-card` blokkeert doorschijnen |

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/TodayAttendanceWidget.tsx` | Verwijder `overflow-hidden` van Card class |

---

## Aanvullend

Als hetzelfde probleem optreedt bij de `ProjectTodayAttendanceWidget`, moet dezelfde fix daar ook worden toegepast.

