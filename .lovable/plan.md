

# Plan: Synchroniseer "Deel van huis" waarden naar Beheer

## Probleem

Wanneer een gebruiker bij taken, kosten of foto's een eigen "deel van huis" waarde intypt (bijv. "Tuinhuis"), verschijnt die wel in de dropdown van dat onderdeel, maar wordt deze **niet** opgeslagen in de `house_parts` tabel. Daardoor ontbreekt de waarde in Beheer en in andere rubrieken.

De `ensureHousePart` functie bestaat al in de `useHouseParts` hook, maar wordt nergens aangeroepen.

## Oplossing

Roep `ensureHousePart` aan op alle plekken waar een gebruiker een "deel van huis" waarde kan invoeren of selecteren. Dit zorgt ervoor dat nieuwe waarden automatisch in de centrale tabel terechtkomen.

## Te wijzigen bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/CreateTaskDialog.tsx` | Na succesvol aanmaken: `ensureHousePart(deel_van_huis)` aanroepen |
| `src/components/project/EditTaskDialog.tsx` | Na succesvol opslaan: `ensureHousePart(deel_van_huis)` aanroepen |
| `src/components/project/MobileTaskWizard.tsx` | Idem bij aanmaken taak |
| `src/components/project/CreateCostDialog.tsx` | Na succesvol aanmaken: `ensureHousePart(deel_van_huis)` aanroepen |
| `src/components/project/EditCostDialog.tsx` | Na succesvol opslaan: `ensureHousePart(deel_van_huis)` aanroepen |
| `src/components/project/ProjectPhotos.tsx` | Bij wijzigen deel_van_huis van een foto: `ensureHousePart` aanroepen |
| `src/components/project/CreateMaintenanceDialog.tsx` | Bij aanmaken onderhoudsinstructie |
| `src/components/project/EditMaintenanceDialog.tsx` | Bij opslaan onderhoudsinstructie |
| `src/components/admin/CreateKeyDialog.tsx` | Bij aanmaken sleutel |

Elk van deze componenten importeert `useHouseParts` (of krijgt `ensureHousePart` als prop) en roept het aan met de ingevulde waarde na een succesvolle create/update.

## Aanvullend: eenmalige synchronisatie bestaande data

Daarnaast verwijderen we de `useMemo`-samenvoeging in `ProjectTasksWithDnd`, `ProjectCosts` en `ProjectPhotos` die bestaande waarden uit de data samenvoegt met `housePartNames`. In plaats daarvan gebruiken we enkel `housePartNames`. Doordat `ensureHousePart` nu altijd wordt aangeroepen, zijn alle waarden al in de tabel aanwezig.

Om bestaande "losse" waarden (zoals "Tuinhuis") alsnog op te nemen, voegen we een eenmalige sync toe in de `useHouseParts` hook: bij het laden van house parts worden ook de unieke `deel_van_huis` waarden uit `tasks`, `costs`, `photos`, `maintenance_instructions` en `keys` opgehaald en eventueel toegevoegd aan `house_parts`.

## Technische details

### Eenmalige sync in `useHouseParts.tsx`

Na het aanroepen van `initialize_house_parts`, haal ook de bestaande `deel_van_huis` waarden op uit de 5 tabellen en voeg ontbrekende toe:

```typescript
// Gather existing values from all tables
const [tasks, costs, photos, maint, keys] = await Promise.all([
  supabase.from("tasks").select("deel_van_huis").eq("project_id", projectId).not("deel_van_huis", "is", null),
  // ... idem voor andere tabellen
]);

const existingNames = new Set(data.map(hp => hp.naam));
const allUsedValues = new Set([...tasks, ...costs, ...photos, ...maint, ...keys]
  .flatMap(r => r.data?.map(d => d.deel_van_huis) || [])
  .filter(Boolean));

const missing = [...allUsedValues].filter(v => !existingNames.has(v));
if (missing.length > 0) {
  await supabase.from("house_parts").insert(
    missing.map(naam => ({ project_id: projectId, naam, volgorde: 0 }))
  );
}
```

### `ensureHousePart` aanroepen in dialogen

Voorbeeld in een create-dialog:

```typescript
const { ensureHousePart } = useHouseParts(projectId);

// Na succesvolle insert:
if (deelVanHuis) {
  await ensureHousePart(deelVanHuis);
}
```

## Resultaat

- Alle bestaande waarden (zoals "Tuinhuis") verschijnen automatisch in Beheer
- Nieuwe waarden die worden ingetypt worden direct aan de `house_parts` tabel toegevoegd
- Alle rubrieken (taken, kosten, foto's, onderhoud, sleutels) tonen dezelfde lijst
