

# Plan: Onderhoudsperiode & Jaaroverzicht voor Onderhoudsinstructies

## Samenvatting

Drie uitbreidingen aan de onderhoudsinstructies:

1. **Periodekalender** bij elke instructie: een begin- en einddatum voor wanneer het onderhoud uitgevoerd moet worden
2. **Jaaroverzicht (tijdlijn)**: een nieuwe visuele lijstweergave die alle onderhoudstaken chronologisch toont per maand, met markering van de huidige dag
3. **Slimme statusbadges**: visuele indicatoren die tonen of een taak binnenkort moet, achterstallig is, of pas later komt

---

## 1. Periodekalender (begin- en einddatum)

Twee nieuwe datumvelden toevoegen aan elke onderhoudsinstructie:

- **Periode van**: de startdatum van wanneer het onderhoud uitgevoerd mag/moet worden
- **Periode tot**: de einddatum (deadline)

In de formulieren (Create en Edit) verschijnen twee Shadcn DatePickers naast elkaar. In de kaartweergave worden de data compact getoond met een kalender-icoon.

---

## 2. Jaaroverzicht (tijdlijn)

Een toggle bovenaan de onderhoudssectie waarmee je kunt schakelen tussen:
- **Groepsweergave** (huidige weergave, gegroepeerd op deel van huis)
- **Tijdlijnweergave** (nieuw, chronologisch per maand)

De tijdlijnweergave toont:

```text
--- Maart 2026 ---  <-- huidige maand gemarkeerd
  [!] CV-ketel service        1 mrt - 15 mrt   Keuken      DEZE WEEK
  [ ] Dakgoot controleren     10 mrt - 31 mrt   Dak

--- April 2026 ---
  [ ] Ventilatieroosters      1 apr - 30 apr    Badkamer

--- Mei 2026 ---
  (geen taken)

--- Achterstallig ---  <-- bovenaan als rode sectie
  [!!] Zonnepanelen reinigen  was: 1 feb - 28 feb
```

Kenmerken:
- **Huidige dag** gemarkeerd met een blauwe lijn/badge
- **Achterstallige taken** (einddatum verstreken) bovenaan in rood
- **Komende week** markering voor urgente items
- **Maanden zonder taken** worden compact getoond of overgeslagen
- Elke kaart toont: titel, periode, deel van huis, frequentie, en statusbadge

---

## 3. Statusbadges en kleuren

Elke instructie krijgt automatisch een visuele status op basis van de periode:

| Status | Kleur | Wanneer |
|--------|-------|---------|
| Achterstallig | Rood | Einddatum is verstreken |
| Deze week | Oranje | Binnen de komende 7 dagen |
| Actief | Groen | Huidige datum valt binnen de periode |
| Gepland | Grijs | Startdatum is in de toekomst |
| Geen periode | - | Geen datums ingesteld |

---

## Technische wijzigingen

### Database migratie

Twee kolommen toevoegen aan `maintenance_instructions`:

```sql
ALTER TABLE maintenance_instructions
  ADD COLUMN periode_van date,
  ADD COLUMN periode_tot date;
```

### Te wijzigen bestanden

| Bestand | Wijziging |
|---------|-----------|
| **Migratie** | `periode_van` en `periode_tot` kolommen toevoegen |
| `EditMaintenanceDialog.tsx` | Twee DatePicker velden toevoegen + interface uitbreiden met `periode_van`, `periode_tot` |
| `CreateMaintenanceDialog.tsx` | Twee DatePicker velden toevoegen + meesturen bij insert |
| `MaintenanceInstructions.tsx` | Toggle voor groeps-/tijdlijnweergave, statusbadges, chronologische sortering, achterstallig-sectie |
| `nl.ts` | Nieuwe i18n keys: periode, van, tot, achterstallig, actief, gepland, tijdlijnweergave, etc. |
| `en.ts` | Engelse vertalingen voor dezelfde keys |

### Logica voor tijdlijnweergave

De tijdlijnweergave groepeert instructies per maand op basis van `periode_van` en plaatst achterstallige items (waar `periode_tot < vandaag`) bovenaan in een aparte rode sectie. Instructies zonder periode worden onderaan getoond in een "Geen periode" groep.

