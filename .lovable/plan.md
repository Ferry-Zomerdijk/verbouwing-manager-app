

# Plan: Meerdere bestanden uploaden bij kostenposten

## Samenvatting

De huidige kostenpost ondersteunt maar 1 factuurbestand (`factuur_url` als tekstveld). Dit plan maakt het mogelijk om meerdere bestanden te uploaden, zowel bij het aanmaken als bij het bewerken van een kostenpost.

## Aanpak

### Database: kolom toevoegen

Een nieuwe kolom `factuur_urls` (text array) wordt toegevoegd aan de `costs` tabel. De bestaande `factuur_url` waarde wordt gemigreerd naar de nieuwe array. De oude kolom blijft bestaan voor backward compatibility maar wordt niet meer gebruikt in de code.

```text
costs tabel:
  factuur_url  text      (bestaand, wordt niet meer gebruikt)
  factuur_urls text[]    (nieuw, vervangt factuur_url)
```

De migratie kopieert bestaande waarden automatisch:
- `factuur_urls = ARRAY[factuur_url]` waar `factuur_url IS NOT NULL`

### UI-wijzigingen

#### CreateCostDialog.tsx
- `uploadedFilePath` wordt `uploadedFilePaths: string[]` (array)
- `selectedFile` wordt `selectedFiles: File[]` (array)
- File input krijgt `multiple` attribuut
- Na AI-scan: bestand wordt toegevoegd aan de lijst (niet vervangen)
- Lijst van geüploade bestanden getoond met per bestand een verwijder-knop
- Bij submit: `factuur_urls` array meesturen

#### EditCostDialog.tsx
- `formData.factuur_url` wordt `factuur_urls: string[]`
- Bestaande bestanden getoond als lijst met verwijder- en bekijk-knoppen
- Nieuw bestand toevoegen via upload-knop (toevoegen aan lijst, niet vervangen)
- Meerdere bestanden tegelijk selecteerbaar via `multiple` attribuut
- Bij submit: `factuur_urls` array meesturen

#### ProjectCosts.tsx (desktop tabel)
- Factuur-kolom toont badge met aantal bestanden (bijv. "2") in plaats van enkele download-knop
- Klik op badge toont dropdown met download-opties per bestand

#### MobileCostCard.tsx
- "Factuur" knop toont aantal bestanden
- Bij meerdere bestanden: expandable lijst met download per bestand

#### ProjectDocuments.tsx
- Cross-linking aangepast: itereert over `factuur_urls` array in plaats van enkele `factuur_url`

### Te wijzigen bestanden

| Bestand | Wijziging |
|---------|-----------|
| `supabase/migrations/` | Nieuwe migratie: kolom `factuur_urls text[]` toevoegen + data migreren |
| `src/integrations/supabase/types.ts` | Wordt automatisch bijgewerkt |
| `src/components/project/CreateCostDialog.tsx` | Multi-file upload bij handmatig en AI tab |
| `src/components/project/EditCostDialog.tsx` | Multi-file upload + bestaande bestanden beheren |
| `src/components/project/ProjectCosts.tsx` | Factuur-kolom aanpassen voor meerdere bestanden |
| `src/components/project/MobileCostCard.tsx` | Factuur-weergave aanpassen voor meerdere bestanden |
| `src/components/project/ProjectDocuments.tsx` | Cross-linking aanpassen voor array |

### Gebruikerservaring

**Aanmaken kostenpost:**
1. Gebruiker klikt op "Nieuwe kostenpost"
2. Bij AI Upload: bestand uploaden en scannen. Bestand verschijnt in lijst
3. Gebruiker kan extra bestanden toevoegen via "+ Bestand toevoegen" knop
4. Per bestand: bestandsnaam + verwijder-knop
5. Bij opslaan worden alle bestanden meegestuurd

**Bewerken kostenpost:**
1. Bestaande bestanden getoond als lijst
2. Per bestand: bekijk-knop (opent in nieuw tabblad) + verwijder-knop
3. "Bestand toevoegen" knop onderaan om extra bestanden toe te voegen
4. Verwijderde bestanden worden ook uit storage verwijderd bij opslaan

**Desktop tabel:**
```text
| ... | Factuur      | ... |
| ... | [3 bestanden]| ... |  <-- klikbaar, toont dropdown
| ... | -            | ... |  <-- geen bestanden
```

