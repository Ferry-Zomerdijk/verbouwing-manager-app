

# Plan: Nieuw tabblad "Beheer" voor huisonderhoud en -instructies

## Samenvatting

Vervang het huidige "Sleutels" tabblad door een breder "Beheer" tabblad. Dit bundelt sleutelbeheer met nieuwe functionaliteit voor onderhoudsinstructies en gebruiksaanwijzingen van het huis.

---

## Voorstel functionaliteit "Beheer"

Het Beheer-tabblad wordt een verzamelplek voor alles rondom het dagelijks gebruik en onderhoud van het huis, opgedeeld in secties:

### 1. Sleutelbeheer (bestaand)
- Bestaande functionaliteit blijft volledig intact
- Wordt een subsectie binnen Beheer

### 2. Onderhoudsinstructies (nieuw)
- Instructies per ruimte/onderdeel van het huis (bijv. "Keuken", "CV-ketel", "Dakgoot")
- Per instructie:
  - Titel (bijv. "CV-ketel ontluchten")
  - Categorie/ruimte (deel van huis)
  - Beschrijving met stapsgewijze instructies
  - Frequentie (bijv. "Jaarlijks", "Maandelijks", "Bij storing")
  - Optioneel: contactpersoon/bedrijf voor onderhoud
  - Aanmaakdatum

### 3. Suggesties voor categorien instructies
Bij het aanmaken automatische suggesties aanbieden:
- CV-ketel en verwarming
- Airconditioning
- Dakgoten en afvoer
- Elektrische installatie
- Waterleiding en sanitair
- Tuin en buitenruimte
- Alarm en beveiliging
- Zonnepanelen
- Ventilatie en afzuiging
- Zwembad/jacuzzi

---

## Technische wijzigingen

### Database: nieuwe tabel `maintenance_instructions`

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid | Primary key |
| project_id | uuid | FK naar projects |
| titel | text | Titel van de instructie |
| beschrijving | text | Uitgebreide instructie/uitleg |
| deel_van_huis | text | Ruimte of onderdeel |
| frequentie | text | Jaarlijks, Maandelijks, etc. |
| contact_naam | text | Optioneel: contactpersoon |
| contact_telefoon | text | Optioneel: telefoonnummer |
| volgorde | integer | Sorteervolgorde |
| created_at | timestamptz | Aanmaakdatum |

RLS-policies volgen het bestaande patroon: `has_project_access()` voor SELECT/INSERT/UPDATE, admin+owner voor DELETE.

### Nieuwe componenten

| Component | Beschrijving |
|-----------|-------------|
| `ProjectManagement.tsx` | Hoofdcomponent voor Beheer-tab met sub-navigatie |
| `MaintenanceInstructions.tsx` | Lijst van onderhoudsinstructies met zoek/filter |
| `CreateMaintenanceDialog.tsx` | Aanmaakdialog (met Drawer op mobiel) |
| `EditMaintenanceDialog.tsx` | Bewerkdialog |

### Bestaande wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ProjectDetail.tsx` | "Sleutels" tab vervangen door "Beheer" tab met icoon `Settings` of `Wrench`. Render `ProjectManagement` i.p.v. `KeyManagement` |
| `src/lib/i18n/nl.ts` + `en.ts` | Vertalingen toevoegen voor Beheer-sectie |
| `src/lib/i18n/types.ts` | Types uitbreiden |

### ProjectManagement component structuur

Het component toont twee secties via een accordion of sub-tabs:

```
┌─────────────────────────────────────┐
│ Beheer                              │
├─────────────────────────────────────┤
│                                     │
│ ▼ Onderhoudsinstructies        [+]  │
│   ┌─────────────────────────────┐   │
│   │ CV-ketel ontluchten         │   │
│   │ Frequentie: Jaarlijks       │   │
│   │ Contact: Warmtebedrijf X    │   │
│   ├─────────────────────────────┤   │
│   │ Dakgoten schoonmaken        │   │
│   │ Frequentie: Halfjaarlijks   │   │
│   └─────────────────────────────┘   │
│                                     │
│ ▼ Sleutelbeheer                [+]  │
│   (bestaande KeyManagement)         │
│                                     │
└─────────────────────────────────────┘
```

---

## Bestanden overzicht

| Actie | Bestand |
|-------|---------|
| Nieuw | `src/components/project/ProjectManagement.tsx` |
| Nieuw | `src/components/project/MaintenanceInstructions.tsx` |
| Nieuw | `src/components/project/CreateMaintenanceDialog.tsx` |
| Nieuw | `src/components/project/EditMaintenanceDialog.tsx` |
| Wijzig | `src/pages/ProjectDetail.tsx` |
| Wijzig | `src/lib/i18n/nl.ts` |
| Wijzig | `src/lib/i18n/en.ts` |
| Wijzig | `src/lib/i18n/types.ts` |
| Migratie | Nieuwe tabel `maintenance_instructions` met RLS |

