
# Plan: Automatisch Versienummer bij Publish met Release Notes

## Overzicht

Dit plan implementeert een systeem waarbij:
1. Het versienummer automatisch wordt verhoogd bij elke publish/build
2. Het versienummer duidelijk zichtbaar is in het profiel
3. Een korte uitleg wordt getoond met de laatste updates sinds de vorige versie

---

## Huidige Situatie

| Onderdeel | Status |
|-----------|--------|
| APP_VERSION | Hardcoded "1.0.0" - verhoogt niet automatisch |
| BUILD_DATE | Wordt automatisch gezet bij elke build via Vite |
| Release notes | Niet aanwezig |
| Update detectie | Werkt via service worker |

---

## Oplossing

### Strategie

Aangezien Lovable geen pre-build scripts ondersteunt voor automatische versie-incrementatie, gebruiken we een **build nummer gebaseerd op timestamp** in combinatie met een **changelog bestand** dat je handmatig bijwerkt met elke belangrijke release.

Dit geeft je:
- **Automatisch uniek buildnummer** bij elke publish (bijv. "1.0.0-2701.2127" voor 27 jan 21:27)
- **Handmatige changelog** met beschrijvingen van wijzigingen per versie
- **Visuele indicator** in profiel wanneer je op een nieuwe build zit

---

## Technische Wijzigingen

### Bestand 1: `src/lib/version.ts`

Uitbreiden met build nummer en changelog:

```typescript
// App version information
export const APP_VERSION = "1.1.0";

// Build number: auto-generated from build date (MMDD.HHmm format)
declare const __BUILD_DATE__: string;
export const BUILD_DATE = typeof __BUILD_DATE__ !== "undefined" 
  ? __BUILD_DATE__ 
  : new Date().toISOString();

// Generate a unique build identifier from the build date
export function getBuildNumber(): string {
  try {
    const date = new Date(BUILD_DATE);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}${day}.${hours}${minutes}`;
  } catch {
    return "0000.0000";
  }
}

// Full version string including build number
export function getFullVersion(): string {
  return `${APP_VERSION}-${getBuildNumber()}`;
}

// Changelog entries - voeg hier nieuwe releases toe
export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.1.0",
    date: "2026-01-27",
    changes: [
      "Status filter toegevoegd aan taken",
      "iPhone toetsenbord-fix voor formulieren",
      "Versiebeheer met release notes toegevoegd"
    ]
  },
  {
    version: "1.0.0",
    date: "2026-01-20",
    changes: [
      "Eerste publieke release",
      "Taakbeheer met Kanban en lijstweergave",
      "Kostenoverzicht en budgetbeheer",
      "PWA ondersteuning voor offline gebruik"
    ]
  }
];

// Get latest changelog entry
export function getLatestChangelog(): ChangelogEntry | null {
  return CHANGELOG[0] || null;
}
```

---

### Bestand 2: `src/components/AccountSettingsDialog.tsx`

Uitbreiden van de "Over deze app" sectie met release notes:

```typescript
// Extra imports
import { getFullVersion, getLatestChangelog, CHANGELOG } from "@/lib/version";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Sparkles } from "lucide-react";

// In de "Over deze app" sectie:

<div className="border-t pt-6 space-y-4">
  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
    <Info className="w-4 h-4" />
    Over deze app
  </h3>

  <div className="space-y-3">
    {/* Versie info - nu met build nummer */}
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="text-muted-foreground">Versie</div>
      <div className="font-medium font-mono">{getFullVersion()}</div>
      
      <div className="text-muted-foreground">Build</div>
      <div className="font-medium">{getFormattedBuildDate()}</div>
      
      <div className="text-muted-foreground">Platform</div>
      <div className="font-medium">{platformInfo.displayName}</div>
    </div>

    {/* Wat is nieuw sectie */}
    {getLatestChangelog() && (
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Wat is nieuw in v{getLatestChangelog()!.version}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <ul className="text-sm space-y-1">
              {getLatestChangelog()!.changes.map((change, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-1">
              {getLatestChangelog()!.date}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    )}

    {/* Update check sectie (bestaande code) */}
    {updateAvailable ? ( ... ) : ( ... )}
  </div>
</div>
```

---

## Visueel Resultaat

Het profiel "Over deze app" sectie zal er zo uitzien:

```text
┌──────────────────────────────────────────┐
│ ℹ️ Over deze app                         │
├──────────────────────────────────────────┤
│ Versie         1.1.0-0127.2130           │
│ Build          27 jan 2026               │
│ Platform       PWA (iOS)                 │
├──────────────────────────────────────────┤
│ ✨ Wat is nieuw in v1.1.0           ▼   │
├──────────────────────────────────────────┤
│ (Uitgevouwen)                            │
│ ┌────────────────────────────────────┐   │
│ │ • Status filter toegevoegd         │   │
│ │ • iPhone toetsenbord-fix           │   │
│ │ • Versiebeheer met release notes   │   │
│ │                                    │   │
│ │ 2026-01-27                         │   │
│ └────────────────────────────────────┘   │
├──────────────────────────────────────────┤
│ [🔄 Controleer op updates]               │
│ ✓ Zojuist gecontroleerd                  │
└──────────────────────────────────────────┘
```

---

## Hoe te Gebruiken

### Bij elke belangrijke release:
1. Verhoog `APP_VERSION` in `src/lib/version.ts` (bijv. van "1.1.0" naar "1.2.0")
2. Voeg een nieuwe entry toe bovenaan de `CHANGELOG` array
3. Publish de app

### Het buildnummer:
- Wordt automatisch gegenereerd uit de build timestamp
- Format: `MMDD.HHmm` (bijv. "0127.2130" voor 27 januari 21:30)
- Uniek per publish, zodat je altijd kunt zien of je de laatste build hebt

---

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/version.ts` | Toevoegen van buildnummer logica, changelog array en helper functies |
| `src/components/AccountSettingsDialog.tsx` | Uitbreiden "Over deze app" met buildnummer en uitklapbare release notes |

---

## Toekomstige Verbeteringen

- Badge tonen in profiel menu wanneer je op een oudere versie zit dan de server
- Push notification sturen bij nieuwe versie
- Volledige changelog historie bekijken in aparte pagina
