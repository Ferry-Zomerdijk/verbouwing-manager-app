

# Plan: Bijlagen toevoegen aan Onderhoudsinstructies

## Samenvatting

Voeg aan onderhoudsinstructies de mogelijkheid toe om bijlagen te koppelen. Gebruikers kunnen:
1. Een nieuw bestand uploaden (bijv. handleiding, garantiebewijs)
2. Een bestaand document uit het project kiezen

---

## Aanpak

### Database: twee nieuwe kolommen op `maintenance_instructions`

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| `bijlage_url` | text | Pad naar geupload bestand in storage |
| `document_id` | uuid | FK naar een bestaand document uit de `documents` tabel |

Beide zijn optioneel en kunnen naast elkaar bestaan (een instructie kan zowel een eigen upload als een gekoppeld document hebben).

### Storage

Uploads gaan naar de bestaande `invoices` bucket (die al gebruikt wordt voor documenten), in het pad `{userId}/{projectId}/{timestamp}.ext`.

### UI in Create/Edit dialogen

Onder de bestaande velden komt een nieuw "Bijlage" gedeelte met twee opties:

```
┌──────────────────────────────────────────────┐
│ Bijlage                                      │
│                                              │
│  [Upload bestand]  of  [Kies uit documenten] │
│                                              │
│  ┌──────────────────────────────────┐        │
│  │ handleiding-cv.pdf         [X]   │        │
│  └──────────────────────────────────┘        │
└──────────────────────────────────────────────┘
```

- **Upload bestand**: Opent een file picker, uploadt naar storage, slaat pad op in `bijlage_url`
- **Kies uit documenten**: Toont een lijst van bestaande projectdocumenten in een dialog, slaat gekozen document_id op in `document_id`
- Gekoppelde bijlage wordt getoond met bestandsnaam en een verwijder-knop
- Bij bewerken worden bestaande bijlagen getoond

### UI in de instructielijst (MaintenanceInstructions.tsx)

Bij elke instructiekaart wordt een bijlage-indicator getoond met een klikbare link om het bestand te downloaden of bekijken.

---

## Technische wijzigingen

### 1. Database migratie

Twee kolommen toevoegen aan `maintenance_instructions`:
- `bijlage_url text` (nullable)
- `document_id uuid` (nullable, geen FK constraint om flexibiliteit te behouden)

### 2. Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/CreateMaintenanceDialog.tsx` | Bijlage upload + document picker toevoegen |
| `src/components/project/EditMaintenanceDialog.tsx` | Zelfde bijlage functionaliteit + bestaande bijlage tonen |
| `src/components/project/MaintenanceInstructions.tsx` | Bijlage-icoon/link tonen bij instructies |
| `src/components/project/EditMaintenanceDialog.tsx` | Interface `MaintenanceInstruction` uitbreiden met `bijlage_url` en `document_id` |
| `src/lib/i18n/nl.ts` | Labels: "Bijlage", "Upload bestand", "Kies uit documenten", "Bijlage verwijderen" |
| `src/lib/i18n/en.ts` | Labels: "Attachment", "Upload file", "Choose from documents", "Remove attachment" |
| `src/lib/i18n/types.ts` | Types uitbreiden voor nieuwe labels |

### 3. Document picker subcomponent

Een kleine selectielijst die de bestaande `documents` query hergebruikt om projectdocumenten te tonen. Wordt weergegeven in een Dialog/Drawer met zoekfunctie.

### 4. Upload flow

1. Gebruiker klikt "Upload bestand"
2. File picker opent
3. Bestand wordt geupload naar `invoices` bucket
4. `bijlage_url` wordt opgeslagen bij de instructie
5. Bij weergave wordt een download-link getoond

### 5. Document koppelen flow

1. Gebruiker klikt "Kies uit documenten"
2. Dialog opent met lijst van projectdocumenten (uit `documents` tabel)
3. Gebruiker selecteert een document
4. `document_id` wordt opgeslagen bij de instructie
5. Bij weergave wordt documentnaam + download-link getoond

