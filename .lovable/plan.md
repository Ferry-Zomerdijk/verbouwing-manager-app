

# Periode omzetten van datum naar maand-selectie

## Wat verandert

De "Periode" velden bij onderhoudsinstructies worden omgezet van een volledige datumselectie naar een **maandselectie** (januari t/m december). Dit past bij het gebruik: onderhoud als schilderwerk kan bijv. alleen van maart t/m oktober, ongeacht het jaar.

## Database migratie

Nieuwe migratie: kolommen `periode_van` en `periode_tot` wijzigen van `date` naar `integer` (1-12, maandnummer).

```sql
ALTER TABLE maintenance_instructions 
  ALTER COLUMN periode_van TYPE integer USING EXTRACT(MONTH FROM periode_van)::integer,
  ALTER COLUMN periode_tot TYPE integer USING EXTRACT(MONTH FROM periode_tot)::integer;
```

## UI wijzigingen

### Nieuw component: `MonthPicker`
Een simpele Select dropdown met de 12 maanden, gelokaliseerd (NL/EN).

### Bestanden die aangepast worden

1. **`src/integrations/supabase/types.ts`** — `periode_van` en `periode_tot` van `string | null` naar `number | null`
2. **`src/components/project/CreateMaintenanceDialog.tsx`** — DatePicker vervangen door MonthPicker Select
3. **`src/components/project/EditMaintenanceDialog.tsx`** — idem
4. **`src/components/project/MaintenanceInstructions.tsx`** — maandnummer formatteren als maandnaam i.p.v. datum
5. **`src/components/project/MaintenanceTimelineView.tsx`** — statuslogica aanpassen: vergelijk huidige maand met periode_van/periode_tot (maandnummers)
6. **`supabase/functions/check-maintenance-due/index.ts`** — periodecheck op maandnummer
7. **`src/lib/i18n/nl.ts` + `en.ts`** — labels aanpassen ("Beginmaand"/"Eindmaand")

### Maand-select UI
```tsx
<Select value={periodeVan} onValueChange={setPeriodeVan}>
  <SelectItem value="1">Januari</SelectItem>
  <SelectItem value="2">Februari</SelectItem>
  ...
  <SelectItem value="12">December</SelectItem>
</Select>
```

### Statuslogica (TimelineView)
In plaats van datum-vergelijking wordt de huidige maand (`new Date().getMonth() + 1`) vergeleken met `periode_van` en `periode_tot`. Wrap-around wordt ondersteund (bijv. november t/m maart).

