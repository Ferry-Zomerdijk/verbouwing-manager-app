
# Plan: Fix "Annuleren" knop op taak detailkaart

## Probleem

De "Annuleren" knop in de EditTaskDialog werkt niet. Bij klikken blijft de dialog open.

---

## Oorzaak

Op regel 497 in `EditTaskDialog.tsx`:

```tsx
<Button 
  type="button" 
  variant="outline" 
  onClick={() => handleCloseRequest(true)}  // ← FOUT: true
  ...
>
  Annuleren
</Button>
```

De `handleCloseRequest` functie verwacht `false` om te sluiten:

```tsx
const handleCloseRequest = (newOpen: boolean) => {
  if (newOpen) {
    onOpenChange(true);  // Blijft open
    return;
  }
  // Sluit alleen bij false...
};
```

Door `true` mee te geven, blijft de dialog open.

---

## Oplossing

Wijzig regel 497 van:
```tsx
onClick={() => handleCloseRequest(true)}
```

naar:
```tsx
onClick={() => handleCloseRequest(false)}
```

---

## Bestand te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/project/EditTaskDialog.tsx` | `handleCloseRequest(true)` → `handleCloseRequest(false)` op regel 497 |

---

## Resultaat

Na deze fix:
- Klikken op "Annuleren" controleert of er onopgeslagen wijzigingen zijn
- Bij geen wijzigingen: dialog sluit direct
- Bij wijzigingen: waarschuwingsdialog verschijnt
