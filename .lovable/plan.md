
# Plan: Fix confetti animatie die niet werkt

## Probleem

De confetti-animatie wordt niet getoond wanneer een taak op "Gereed" wordt gezet, ondanks dat de code correct geïmplementeerd lijkt.

---

## Oorzaak

Na analyse van de codebase is gebleken dat:

1. **De `canvas-confetti` library is geïnstalleerd** (v1.9.4 in package.json)
2. **De import en utility functie zijn correct** in `confettiUtils.ts`
3. **De integratie in componenten is correct** (MobileTaskList, ProjectTasksWithDnd, etc.)

**Het probleem**: TypeScript herkent de module niet omdat er geen type declarations zijn voor `canvas-confetti`. Dit kan leiden tot runtime problemen of de bundler die de import niet correct afhandelt.

---

## Oplossing

Een TypeScript declaration file toevoegen voor `canvas-confetti` zodat TypeScript de module correct herkent en de bundler het juist kan verwerken.

---

## Technische wijzigingen

### Nieuw bestand: `src/types/canvas-confetti.d.ts`

```typescript
declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: ('square' | 'circle')[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface ConfettiFunction {
    (options?: ConfettiOptions): Promise<null>;
    reset: () => void;
    create: (canvas: HTMLCanvasElement, options?: { resize?: boolean; useWorker?: boolean }) => ConfettiFunction;
  }

  const confetti: ConfettiFunction;
  export default confetti;
}
```

### Update: `tsconfig.app.json`

Toevoegen van de types directory aan de include array:

```json
{
  "include": ["src", "src/types"]
}
```

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/types/canvas-confetti.d.ts` | **Nieuw** - TypeScript type declarations |
| `tsconfig.app.json` | Toevoegen van `src/types` aan include array |

---

## Na implementatie

Test door:
1. Een taak te selecteren die nog niet "Gereed" is
2. Wijzig de status naar "Gereed" 
3. Je zou nu confetti moeten zien verschijnen

