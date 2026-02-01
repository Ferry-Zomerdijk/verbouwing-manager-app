

# Plan: Categorieënbeheer toevoegen aan Contacten pagina

## Samenvatting

Een nieuwe "Rubrieken beheren" functionaliteit toevoegen aan de Contacten pagina, vergelijkbaar met hoe "Betalers" beheerd kunnen worden op de Kosten pagina. Dit geeft gebruikers de mogelijkheid om alle categorieën (rubrieken) op één plek te beheren: toevoegen, hernoemen, verwijderen en de volgorde aanpassen.

---

## Huidige situatie

| Aspect | Betalers (Kosten) | Rubrieken (Contacten) |
|--------|-------------------|----------------------|
| Beheer dialog | `CostPayersManager` - alles-in-één | Losse dialogs: `CreateCategoryDialog` + `EditCategoryDialog` |
| Toevoegen | Via manager | Via aparte knop "Nieuwe rubriek" |
| Bewerken | Via manager | Via dropdown per rubriek |
| Verwijderen | Via manager | Via dropdown per rubriek |
| Volgorde aanpassen | Via up/down knoppen | Niet mogelijk |
| Reset naar standaard | Ja | Nee |

---

## Oplossing

Maak een nieuwe `ContactCategoriesManager` component die:
1. Alle rubrieken in een lijst toont
2. Inline bewerken van namen mogelijk maakt
3. Volgorde aanpassen met up/down knoppen
4. Verwijderen per rubriek (met waarschuwing dat contacten naar "Overig" gaan)
5. Toevoegen van nieuwe rubrieken
6. Suggesties voor standaard rubrieken
7. Opslaan als batch (net als bij Betalers)

---

## Technische wijzigingen

### 1. Nieuw bestand: `src/components/project/ContactCategoriesManager.tsx`

Nieuwe component gebaseerd op `CostPayersManager` met aanpassingen:

- Gebruikt `contact_categories` tabel i.p.v. `cost_payers`
- Velden: `id`, `naam`, `volgorde` (sort_order)
- Standaard suggesties uit `CreateCategoryDialog` (Alarm & Beveiliging, Tuinonderhoud, etc.)
- Beschrijvingstekst: "Configureer rubrieken voor je contacten. Rubrieken helpen je contacten te groeperen per specialisme."
- Dialog titel: "Rubrieken beheren"

**Hoofdstructuur:**
```tsx
interface ContactCategory {
  id: string;
  naam: string;
  volgorde: number;
}

interface ContactCategoriesManagerProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Functionaliteiten:**
- `handleAddCategory()` - nieuwe lege rij toevoegen
- `handleUpdateCategory()` - naam inline bewerken
- `handleDeleteCategory()` - rij verwijderen
- `handleMoveUp()` / `handleMoveDown()` - volgorde wijzigen
- `handleResetToDefault()` - standaard rubrieken laden
- `handleSave()` - alle wijzigingen opslaan als batch

---

### 2. Wijziging: `src/components/project/ProjectContacts.tsx`

**State toevoegen:**
```tsx
const [categoriesManagerOpen, setCategoriesManagerOpen] = useState(false);
```

**Knop toevoegen naast "Nieuwe rubriek":**
```tsx
<Button 
  variant="outline" 
  size="sm"
  onClick={() => setCategoriesManagerOpen(true)}
>
  <Settings className="w-4 h-4 sm:mr-2" />
  <span className="hidden sm:inline">Rubrieken</span>
</Button>
```

**Manager component toevoegen:**
```tsx
<ContactCategoriesManager
  projectId={projectId}
  open={categoriesManagerOpen}
  onOpenChange={setCategoriesManagerOpen}
/>
```

---

### 3. Wijziging: `src/lib/i18n/nl.ts`

Teksten toevoegen voor de nieuwe manager:

```typescript
contacts: {
  // ... bestaande teksten
  dialogs: {
    // ... bestaande
    categoriesManagerTitle: "Rubrieken beheren",
    categoriesManagerDescription: "Configureer rubrieken voor je contacten. Rubrieken helpen je contacten te groeperen per specialisme.",
  },
  messages: {
    // ... bestaande
    categoriesSaved: "Rubrieken opgeslagen",
    minOneCategory: "Voeg minimaal één rubriek toe",
    categoryDeleted: "Rubriek verwijderd. Contacten verplaatst naar 'Overig'.",
  },
}
```

---

### 4. Wijziging: `src/lib/i18n/en.ts`

Engelse vertalingen toevoegen:

```typescript
contacts: {
  dialogs: {
    categoriesManagerTitle: "Manage categories",
    categoriesManagerDescription: "Configure categories for your contacts. Categories help you group contacts by specialty.",
  },
  messages: {
    categoriesSaved: "Categories saved",
    minOneCategory: "Add at least one category",
    categoryDeleted: "Category deleted. Contacts moved to 'Other'.",
  },
}
```

---

### 5. Wijziging: `src/lib/i18n/types.ts`

Type definities uitbreiden:

```typescript
contacts: {
  // ... bestaande
  dialogs: {
    // ... bestaande
    categoriesManagerTitle: string;
    categoriesManagerDescription: string;
  };
  messages: {
    // ... bestaande
    categoriesSaved: string;
    minOneCategory: string;
    categoryDeleted: string;
  };
};
```

---

## Standaard suggesties (uit CreateCategoryDialog)

| Rubriek |
|---------|
| Alarm & Beveiliging |
| Hekwerk & Toegang |
| Tuinonderhoud |
| Schilderwerk |
| Loodgieter |
| Elektricien |
| Jacuzzi & Wellness |
| Schoonmaak |
| Verwarming & Airco |
| Dakwerk |

---

## UI Flow

1. Gebruiker klikt op "Rubrieken" knop (Settings icoon)
2. Dialog opent met alle bestaande rubrieken
3. Per rubriek: up/down knoppen + naam input + delete knop
4. Onderaan: "Nieuwe rubriek toevoegen" knop
5. "Standaard" knop laadt de 10 standaard suggesties
6. "Opslaan" slaat alle wijzigingen op en sluit de dialog

---

## Bestanden te wijzigen/maken

| Bestand | Actie |
|---------|-------|
| `src/components/project/ContactCategoriesManager.tsx` | Nieuw |
| `src/components/project/ProjectContacts.tsx` | Wijzigen |
| `src/lib/i18n/nl.ts` | Wijzigen |
| `src/lib/i18n/en.ts` | Wijzigen |
| `src/lib/i18n/types.ts` | Wijzigen |

