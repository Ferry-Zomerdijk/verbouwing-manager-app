

# Plan: Fix klikbare fase-badge (ref forwarding probleem)

## Probleem

De fase-badge reageert niet op klikken omdat de `Badge` component geen refs kan doorsturen. De console toont:

> "Warning: Function components cannot be given refs. Did you mean to use React.forwardRef()?"

Wanneer `DropdownMenuTrigger` met `asChild` wordt gebruikt, moet het child-element refs kunnen ontvangen om de klik-events correct af te handelen.

---

## Oorzaak

De huidige `Badge` component (regel 25-27 in badge.tsx):

```tsx
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

Mist `React.forwardRef()` - daardoor kan Radix UI geen ref toewijzen en werken de klik-events niet.

---

## Oplossing

De `Badge` component aanpassen om `forwardRef` te gebruiken:

```tsx
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn(badgeVariants({ variant }), className)} 
        {...props} 
      />
    );
  }
);
Badge.displayName = "Badge";
```

Dit is dezelfde patroon dat andere UI componenten (Button, Input, etc.) al gebruiken.

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/ui/badge.tsx` | `forwardRef` toevoegen aan Badge component |

---

## Resultaat

Na deze fix:
- De fase-badge in de foto-grid wordt klikbaar
- De fase-badge in de lightbox wordt klikbaar
- Dropdown verschijnt met Voor/Tijdens/Na opties
- Geen console warnings meer

