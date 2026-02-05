
# Plan: Fix doorklikken vanuit project leveringen widget

## Probleem

De widget op de projectpagina navigeert naar dezelfde URL met een `?task=` parameter:
```typescript
navigate(`/project/${projectId}?task=${delivery.id}`)
```

Maar omdat je al op die projectpagina bent:
- React Router mount de `ProjectDetail` component NIET opnieuw
- `defaultValue={initialTab}` wordt alleen bij eerste render gebruikt
- De Tabs component blijft op "overzicht" staan
- De `ProjectTasksWithDnd` component (die de taak opent) wordt nooit gemount

---

## Oplossing

Maak de Tabs component "controlled" zodat deze reageert op URL-wijzigingen, ook als de gebruiker al op de pagina is.

---

## Technische wijzigingen

### ProjectDetail.tsx

**1. State toevoegen voor actieve tab:**
```typescript
const [activeTab, setActiveTab] = useState<string>(
  searchParams.get('task') ? 'taken' : 'overzicht'
);
```

**2. Effect om te reageren op URL wijzigingen:**
```typescript
useEffect(() => {
  if (searchParams.get('task')) {
    setActiveTab('taken');
  }
}, [searchParams]);
```

**3. Tabs component aanpassen naar controlled mode:**
```tsx
<Tabs 
  value={activeTab} 
  onValueChange={setActiveTab} 
  className="w-full"
>
```

---

## Flow na wijziging

1. Gebruiker klikt op levering in project widget
2. `navigate()` wijzigt de URL naar `?task={id}`
3. `searchParams` verandert → useEffect triggert
4. `setActiveTab('taken')` wordt aangeroepen
5. Tabs switcht naar "taken" tab
6. `ProjectTasksWithDnd` mount en opent de taak dialog

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ProjectDetail.tsx` | Controlled Tabs met state + useEffect voor URL changes |
