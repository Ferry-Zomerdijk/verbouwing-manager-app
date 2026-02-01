
# Plan: Klikbare fase-badge op foto's (Voor/Tijdens/Na)

## Samenvatting

De fase-badge op foto's (Voor, Tijdens, Na) klikbaar maken zodat gebruikers door te klikken direct de fase kunnen wijzigen. Bij klikken verschijnt een dropdown met de drie opties.

---

## Huidige situatie vs. gewenste situatie

| Aspect | Huidig | Gewenst |
|--------|--------|---------|
| Fase-badge op foto | Statische tekst, niet klikbaar | Klikbaar, toont dropdown met opties |
| Fase wijzigen | Niet mogelijk na upload | Direct aanpasbaar via badge-klik |
| Gebruikerservaring | Moet foto verwijderen en opnieuw uploaden | Eenvoudig klikken om te wijzigen |

---

## Visueel resultaat

**Huidige weergave:**
```text
┌─────────────────┐
│ [Voor]    [🗑️] │  ← Badge is statisch
│                 │
│   [foto]        │
│                 │
│ [📍 Keuken]     │
└─────────────────┘
```

**Nieuwe weergave (na klik op badge):**
```text
┌─────────────────┐
│ [Voor ▾]  [🗑️] │  ← Badge met dropdown indicator
│  ┌──────────┐   │
│  │ ● Voor   │   │  ← Dropdown verschijnt
│  │ ○ Tijdens│   │
│  │ ○ Na     │   │
│  └──────────┘   │
│ [📍 Keuken]     │
└─────────────────┘
```

---

## Technische wijzigingen

### Bestand: `src/components/project/ProjectPhotos.tsx`

#### 1. Nieuwe state toevoegen (rond regel 44)

```tsx
const [updatingPhotoId, setUpdatingPhotoId] = useState<string | null>(null);
```

#### 2. Nieuwe update functie toevoegen (na handleDelete functie, rond regel 248)

```tsx
const handleUpdateFase = async (photoId: string, newFase: PhotoPhase) => {
  setUpdatingPhotoId(photoId);
  try {
    const { error } = await supabase
      .from("photos")
      .update({ fase: newFase })
      .eq("id", photoId);
    
    if (error) throw error;
    
    toast.success("Fase bijgewerkt");
    refetch();
  } catch (error: any) {
    toast.error(error.message || "Er is een fout opgetreden");
  } finally {
    setUpdatingPhotoId(null);
  }
};
```

#### 3. Klikbare badge in foto-grid (regels 371-373)

Vervang de statische Badge door een DropdownMenu:

**Huidige code:**
```tsx
<Badge className={`${faseColors[photo.fase]} text-white absolute top-2 left-2`}>
  {photo.fase}
</Badge>
```

**Nieuwe code:**
```tsx
{!readOnly ? (
  <DropdownMenu>
    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
      <Badge 
        className={`${faseColors[photo.fase]} text-white absolute top-2 left-2 cursor-pointer hover:opacity-90 transition-opacity`}
      >
        {updatingPhotoId === photo.id ? "..." : photo.fase}
      </Badge>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      {(["Voor", "Tijdens", "Na"] as PhotoPhase[]).map((fase) => (
        <DropdownMenuItem
          key={fase}
          onClick={(e) => {
            e.stopPropagation();
            if (fase !== photo.fase) {
              handleUpdateFase(photo.id, fase);
            }
          }}
          className={fase === photo.fase ? "bg-accent" : ""}
        >
          <span className={`w-3 h-3 rounded-full mr-2 ${faseColors[fase]}`} />
          {fase}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  <Badge className={`${faseColors[photo.fase]} text-white absolute top-2 left-2`}>
    {photo.fase}
  </Badge>
)}
```

#### 4. Klikbare badge in lightbox (regels 603-605)

**Huidige code:**
```tsx
<Badge className={`${faseColors[selectedPhoto.fase]} text-white`}>
  {selectedPhoto.fase}
</Badge>
```

**Nieuwe code:**
```tsx
{!readOnly ? (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Badge 
        className={`${faseColors[selectedPhoto.fase]} text-white cursor-pointer hover:opacity-90 transition-opacity`}
      >
        {updatingPhotoId === selectedPhoto.id ? "..." : selectedPhoto.fase}
      </Badge>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      {(["Voor", "Tijdens", "Na"] as PhotoPhase[]).map((fase) => (
        <DropdownMenuItem
          key={fase}
          onClick={() => {
            if (fase !== selectedPhoto.fase) {
              handleUpdateFase(selectedPhoto.id, fase);
              setSelectedPhoto({ ...selectedPhoto, fase });
            }
          }}
          className={fase === selectedPhoto.fase ? "bg-accent" : ""}
        >
          <span className={`w-3 h-3 rounded-full mr-2 ${faseColors[fase]}`} />
          {fase}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  <Badge className={`${faseColors[selectedPhoto.fase]} text-white`}>
    {selectedPhoto.fase}
  </Badge>
)}
```

#### 5. Imports toevoegen (bovenaan het bestand)

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

---

## Gebruikerservaring

1. **Foto-grid**: Klik op de gekleurde badge → dropdown verschijnt → kies nieuwe fase
2. **Lightbox**: Zelfde functionaliteit bij het bekijken van een grote foto
3. **Visuele feedback**: Badge toont "..." tijdens het opslaan
4. **Read-only modus**: Badge blijft statisch (niet klikbaar) voor publieke weergave

---

## Randgevallen

- **Read-only modus**: Badge blijft niet-klikbaar voor publieke projectweergave
- **Optimistic update in lightbox**: Lokale state wordt direct bijgewerkt voor snelle feedback
- **Event propagation**: `stopPropagation()` voorkomt dat foto-klik de lightbox opent bij badge-klik

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/ProjectPhotos.tsx` | Klikbare fase-badge met dropdown + update functie |
