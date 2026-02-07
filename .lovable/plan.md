
# Plan: Smart Zoekfunctie voor Kostenposten

## Samenvatting

Verbeter de zoekfunctie voor kostenposten zodat deze intelligenter werkt met real-time resultaten en zoekt door alle relevante velden. Voeg visuele feedback toe zodat gebruikers zien welke velden matchen.

---

## Huidige Situatie

De zoekfunctie werkt al real-time bij het typen en doorzoekt de volgende velden:
- Beschrijving
- Leverancier  
- Deel van huis
- Categorie
- Status
- Betaald door
- Koppeling begrotingspost
- Bedrag

**Niet doorzocht:**
- Datum (bijv. zoeken op "januari" of "2024")

---

## Verbeteringen

### 1. Datum toevoegen aan zoekbare velden

Gebruikers kunnen zoeken op datumwaarden:
- Geformatteerde datum: "15-01-2024", "januari", "2024"
- Dit maakt het makkelijk om alle kosten van een bepaalde maand te vinden

### 2. Verbeterde placeholder tekst

Vervang "Zoek..." met "Zoek in alle velden..." of toon een tooltip met doorzoekbare velden.

### 3. Toon aantal resultaten tijdens zoeken

Voeg direct onder het zoekveld een indicator toe die toont hoeveel resultaten gevonden zijn terwijl je typt.

---

## Technische Wijzigingen

### ProjectCosts.tsx (Desktop)

```typescript
// In filteredCosts useMemo - toevoegen datum veld
const matchSearch = !query || [
  cost.beschrijving,
  cost.leverancier,
  cost.deel_van_huis,
  cost.categorie,
  cost.status,
  cost.betaald_door,
  cost.koppeling_begrotingspost,
  cost.bedrag?.toString(),
  // NIEUW: geformatteerde datum voor zoeken
  format(new Date(cost.datum), "dd-MM-yyyy"),
  format(new Date(cost.datum), "MMMM yyyy", { locale: nl }),
].some(field => field?.toLowerCase().includes(query));
```

```tsx
// Verbeterde placeholder en zoekresultaten indicator
<Input
  placeholder="Zoek in beschrijving, leverancier, datum..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="pl-9 pr-9 h-9"
/>
{searchQuery && (
  <p className="text-xs text-muted-foreground mt-1">
    {filteredCosts.length} resultaten gevonden
  </p>
)}
```

### MobileCostList.tsx (Mobiel)

Dezelfde verbeteringen toepassen:
- Datum toevoegen aan zoekvelden
- Verbeterde placeholder tekst
- Resultaten teller toevoegen

---

## Wijzigingen per bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/ProjectCosts.tsx` | Datum toevoegen aan zoekfilter, placeholder verbeteren, resultaten indicator |
| `src/components/project/MobileCostList.tsx` | Zelfde verbeteringen voor mobiele weergave |

---

## Gebruikerservaring

- Typ "januari" → vindt alle kosten uit januari
- Typ "2024" → vindt alle kosten uit 2024
- Typ "IKEA" → vindt kosten met IKEA als leverancier
- Typ "500" → vindt kosten met €500 of bevat "500" in beschrijving
- Real-time teller toont "X resultaten gevonden"

---

## Voorbeeld Resultaat

```
┌──────────────────────────────────────────┐
│ 🔍 Zoek in beschrijving, leverancier,    │
│    datum, categorie...                   │
│    ────────────────────────────────── X  │
│ 3 resultaten gevonden                    │
└──────────────────────────────────────────┘
```
