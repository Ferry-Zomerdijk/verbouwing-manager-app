
# Plan: Klikbare locatie-badge met betere kleuren

## Samenvatting

De locatie-badge (deel van huis) op foto's klikbaar maken met een dropdown om de locatie te wijzigen. Daarnaast betere kleuren toepassen voor contrast.

---

## Huidige situatie vs. gewenste situatie

| Aspect | Huidig | Gewenst |
|--------|--------|---------|
| Locatie-badge op foto | Statische tekst | Klikbaar, toont dropdown met ruimtes |
| Locatie wijzigen | Niet mogelijk na upload | Direct aanpasbaar via badge-klik |
| Badge kleuren | `bg-background/80` (lage contrast) | Duidelijke contrastrijke kleuren |

---

## Visueel resultaat

**Nieuwe weergave (na klik op locatie-badge):**
```text
┌─────────────────┐
│ [Voor ▾]  [🗑️] │
│                 │
│   [foto]        │
│                 │
│ [📍 Keuken ▾]   │  ← Klikbaar met dropdown
│  ┌────────────┐ │
│  │ ● Woning   │ │
│  │ ○ Keuken   │ │  ← Dropdown met ruimtes
│  │ ○ Badkamer │ │
│  │ ○ ...      │ │
│  └────────────┘ │
└─────────────────┘
```

---

## Technische wijzigingen

### Bestand: `src/components/project/ProjectPhotos.tsx`

#### 1. Nieuwe update functie toevoegen (na handleUpdateFase)

```tsx
const handleUpdateDeelVanHuis = async (photoId: string, newDeelVanHuis: string) => {
  setUpdatingPhotoId(photoId);
  try {
    const { error } = await supabase
      .from("photos")
      .update({ deel_van_huis: newDeelVanHuis })
      .eq("id", photoId);
    
    if (error) throw error;
    
    toast.success("Locatie bijgewerkt");
    refetch();
  } catch (error: any) {
    toast.error(error.message || "Er is een fout opgetreden");
  } finally {
    setUpdatingPhotoId(null);
  }
};
```

#### 2. Locatie kleuren object toevoegen (na faseColors)

```tsx
const locationColors: Record<string, string> = {
  "Woning": "bg-slate-600 text-white",
  "Keuken": "bg-amber-600 text-white",
  "Badkamer": "bg-cyan-600 text-white",
  "Slaapkamer": "bg-indigo-600 text-white",
  "Woonkamer": "bg-emerald-600 text-white",
  "Garage": "bg-zinc-600 text-white",
  "Tuin": "bg-green-600 text-white",
  "Zolder": "bg-purple-600 text-white",
  "Hal": "bg-rose-600 text-white",
};

const getLocationColor = (location: string) => {
  return locationColors[location] || "bg-gray-700 text-white";
};
```

#### 3. Klikbare locatie-badge in foto-grid (regels 429-434)

**Huidige code:**
```tsx
{photo.deel_van_huis && photo.deel_van_huis !== "Nog invullen" && (
  <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs bg-background/80 backdrop-blur-sm">
    <MapPin className="w-3 h-3 mr-1" />
    {photo.deel_van_huis}
  </Badge>
)}
```

**Nieuwe code:**
```tsx
{!readOnly ? (
  <DropdownMenu>
    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
      <Badge 
        className={`absolute bottom-2 left-2 text-xs cursor-pointer hover:opacity-90 transition-opacity ${
          photo.deel_van_huis && photo.deel_van_huis !== "Nog invullen" 
            ? getLocationColor(photo.deel_van_huis) 
            : "bg-gray-500 text-white"
        }`}
      >
        <MapPin className="w-3 h-3 mr-1" />
        {updatingPhotoId === photo.id ? "..." : (photo.deel_van_huis || "Locatie")}
      </Badge>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
      {availableDelenVanHuis.map((deel) => (
        <DropdownMenuItem
          key={deel}
          onClick={(e) => {
            e.stopPropagation();
            if (deel !== photo.deel_van_huis) {
              handleUpdateDeelVanHuis(photo.id, deel);
            }
          }}
          className={deel === photo.deel_van_huis ? "bg-accent" : ""}
        >
          <span className={`w-3 h-3 rounded-full mr-2 ${getLocationColor(deel).split(' ')[0]}`} />
          {deel}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  photo.deel_van_huis && photo.deel_van_huis !== "Nog invullen" && (
    <Badge className={`absolute bottom-2 left-2 text-xs ${getLocationColor(photo.deel_van_huis)}`}>
      <MapPin className="w-3 h-3 mr-1" />
      {photo.deel_van_huis}
    </Badge>
  )
)}
```

#### 4. Klikbare locatie-badge in lightbox (regels 690-695)

**Huidige code:**
```tsx
{selectedPhoto.deel_van_huis && (
  <Badge variant="secondary">
    <MapPin className="w-3 h-3 mr-1" />
    {selectedPhoto.deel_van_huis}
  </Badge>
)}
```

**Nieuwe code:**
```tsx
{!readOnly ? (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Badge 
        className={`cursor-pointer hover:opacity-90 transition-opacity ${
          selectedPhoto.deel_van_huis && selectedPhoto.deel_van_huis !== "Nog invullen"
            ? getLocationColor(selectedPhoto.deel_van_huis)
            : "bg-gray-500 text-white"
        }`}
      >
        <MapPin className="w-3 h-3 mr-1" />
        {updatingPhotoId === selectedPhoto.id ? "..." : (selectedPhoto.deel_van_huis || "Locatie")}
      </Badge>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
      {availableDelenVanHuis.map((deel) => (
        <DropdownMenuItem
          key={deel}
          onClick={() => {
            if (deel !== selectedPhoto.deel_van_huis) {
              handleUpdateDeelVanHuis(selectedPhoto.id, deel);
              setSelectedPhoto({ ...selectedPhoto, deel_van_huis: deel });
            }
          }}
          className={deel === selectedPhoto.deel_van_huis ? "bg-accent" : ""}
        >
          <span className={`w-3 h-3 rounded-full mr-2 ${getLocationColor(deel).split(' ')[0]}`} />
          {deel}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  selectedPhoto.deel_van_huis && selectedPhoto.deel_van_huis !== "Nog invullen" && (
    <Badge className={getLocationColor(selectedPhoto.deel_van_huis)}>
      <MapPin className="w-3 h-3 mr-1" />
      {selectedPhoto.deel_van_huis}
    </Badge>
  )
)}
```

---

## Kleurenpalet voor locaties

| Locatie | Kleur | Visueel |
|---------|-------|---------|
| Woning | `bg-slate-600` | Neutrale basis |
| Keuken | `bg-amber-600` | Warm, kookvuur |
| Badkamer | `bg-cyan-600` | Water, fris |
| Slaapkamer | `bg-indigo-600` | Rustig, nacht |
| Woonkamer | `bg-emerald-600` | Levendig, groen |
| Garage | `bg-zinc-600` | Industrieel |
| Tuin | `bg-green-600` | Natuur |
| Zolder | `bg-purple-600` | Verborgen ruimte |
| Hal | `bg-rose-600` | Welkom |
| Overige | `bg-gray-700` | Fallback |

---

## Belangrijke details

- **Altijd zichtbaar**: Locatie-badge wordt altijd getoond (niet alleen wanneer ingevuld)
- **Read-only modus**: Badge blijft niet-klikbaar voor publieke weergave
- **Optimistic update in lightbox**: Lokale state wordt direct bijgewerkt
- **Event propagation**: `stopPropagation()` in grid voorkomt lightbox openen bij badge-klik
- **Scrollbare dropdown**: `max-h-64 overflow-y-auto` voor lange lijsten

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/ProjectPhotos.tsx` | Klikbare locatie-badge + kleuren + update functie |
