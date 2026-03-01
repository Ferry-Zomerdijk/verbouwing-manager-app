

# Plan: Status toevoegen aan onderhoudsinstructies

## Samenvatting

Een statusveld toevoegen aan onderhoudsinstructies met vier opties: **Nog doen**, **Mee bezig**, **Gedaan** en **On hold**. De status is direct aanpasbaar met een enkele tik op een kleurgecodeerde badge, zonder een dialoog te openen — ideaal voor mobiel gebruik.

## Gebruikerservaring

Op elke onderhoudskaart verschijnt een gekleurde statusbadge. Bij het tikken opent een compact dropdown-menu met de vier opties. De statuswijziging wordt direct opgeslagen.

```text
+---------------------------------------------+
|  CV-ketel service                           |
|  [Nog doen ▼]   Maandelijks   Keuken       |
|                                              |
|  Statusmenu (bij tik):                      |
|  +--------------------+                     |
|  |  ● Nog doen        |  <- blauw           |
|  |  ● Mee bezig       |  <- oranje          |
|  |  ● Gedaan          |  <- groen           |
|  |  ● On hold         |  <- grijs           |
|  +--------------------+                     |
+---------------------------------------------+
```

### Kleuren

| Status | Kleur | Achtergrond |
|--------|-------|-------------|
| Nog doen | Blauw | `bg-blue-100 text-blue-700` |
| Mee bezig | Oranje | `bg-orange-100 text-orange-700` |
| Gedaan | Groen | `bg-green-100 text-green-700` |
| On hold | Grijs | `bg-gray-100 text-gray-600` |

Op mobiel is de badge extra groot (touch-friendly, min 44px taphoogte) en opent het menu als een `DropdownMenu` component.

## Technische wijzigingen

### 1. Database migratie

Een nieuw `status` kolom toevoegen aan `maintenance_instructions`:

```sql
ALTER TABLE maintenance_instructions
  ADD COLUMN status text NOT NULL DEFAULT 'Nog doen';
```

De status wordt opgeslagen als tekst met vaste waarden: `Nog doen`, `Mee bezig`, `Gedaan`, `On hold`.

### 2. Te wijzigen bestanden

| Bestand | Wijziging |
|---------|-----------|
| **Migratie** | `status` kolom toevoegen |
| `EditMaintenanceDialog.tsx` | `status` veld toevoegen aan interface + formulier (Select dropdown) + meesturen bij update |
| `CreateMaintenanceDialog.tsx` | `status` veld toevoegen aan formulier + meesturen bij insert |
| `MaintenanceInstructions.tsx` | Inline statusbadge met `DropdownMenu` op elke kaart in groepsweergave; direct update via Supabase |
| `MaintenanceTimelineView.tsx` | Statusbadge tonen op timeline-kaarten met dezelfde inline-wijzig functionaliteit |
| `nl.ts` | i18n keys voor de vier statussen |
| `en.ts` | Engelse vertalingen (To do, In progress, Done, On hold) |
| `types.ts` | i18n type-definities uitbreiden |

### 3. Inline status-toggle component

Een herbruikbaar `MaintenanceStatusBadge` component dat:
- De huidige status toont als gekleurde badge
- Bij klik/tik een `DropdownMenu` opent met de vier opties
- Bij selectie direct een Supabase `update` uitvoert op het `status` veld
- De query-cache invalideert na succesvolle update
- `e.stopPropagation()` gebruikt zodat de kaart-klik (edit) niet triggert

### 4. Formulieren

In Create en Edit dialogen komt een Select-dropdown voor status, met als standaard "Nog doen". Dit biedt een alternatieve manier om de status te wijzigen naast de inline badge.

