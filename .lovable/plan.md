

# Plan: Hoofdlettergebruik corrigeren in Nederlandse en Engelse teksten

## Probleem

Op meerdere plekken in de app wordt onjuist hoofdlettergebruik toegepast. In het Nederlands krijgt alleen het eerste woord van een zin/kop een hoofdletter (sentence case). Woorden als "Uitnodigingen", "Beheren", "Link" etc. moeten klein geschreven worden als ze niet aan het begin staan.

## Gevonden fouten

### Nederlands - Onjuist hoofdlettergebruik (Title Case i.p.v. sentence case)

| Locatie | Huidig (fout) | Correctie |
|---------|--------------|-----------|
| `UserManagement.tsx:410` | Gebruikers Beheren | Gebruikers beheren |
| `UserManagement.tsx:428` | Gebruikers Beheren | Gebruikers beheren |
| `UserManagement.tsx:445` | Project Gebruikers | Projectgebruikers |
| `UserManagement.tsx:451` | Platform Gebruikers | Platformgebruikers |
| `UserManagement.tsx:570` | Openstaande Uitnodigingen | Openstaande uitnodigingen |
| `UserManagement.tsx:810` | Taaktypes Beheren | Taaktypes beheren |
| `UserManagement.tsx:813` | Types Beheren | Types beheren |
| `UserManagement.tsx:822` | "Types Beheren" (in tekst) | "Types beheren" |
| `Auth.tsx:69` | Gebruikers Beheren | Gebruikers beheren |
| `AdminUsersDialog.tsx:133` | Gebruikers Beheren | Gebruikers beheren |
| `Dashboard.tsx:274` | Gebruikers Beheren | Gebruikers beheren |
| `InviteProjectUserDialog.tsx:162` | Kopieer Link | Kopieer link |
| `InviteProjectUserDialog.tsx:212` | Projectgebruiker Uitnodigen | Projectgebruiker uitnodigen |
| `InviteProjectUserDialog.tsx:227` | Genereer Link | Genereer link |
| `InviteProjectUserDialog.tsx:245` | Kopieer Link | Kopieer link |
| `InviteProjectUserDialog.tsx:264` | Projectgebruiker Uitnodigen | Projectgebruiker uitnodigen |
| `ProjectUsersManager.tsx:70` | Projectgebruikers Beheren | Projectgebruikers beheren |
| `DocumentTypesManager.tsx:168` | Document Types Beheren | Documenttypes beheren |
| `TaskTypesManager.tsx:191` | Taaktypes Beheren | Taaktypes beheren |

### Engels - Controle

De Engelse vertalingen in `en.ts` gebruiken correct sentence case (bijv. "New task", "Cost overview", "Part of house"). Hier zijn geen correcties nodig. In het Engels is sentence case de juiste keuze voor labels en koppen in UI-elementen, en dat wordt al consistent toegepast.

## Wijzigingen per bestand

### 1. `src/pages/UserManagement.tsx`
- Regel 410, 428: "Gebruikers Beheren" -> "Gebruikers beheren"
- Regel 445: "Project Gebruikers" -> "Projectgebruikers"
- Regel 451: "Platform Gebruikers" -> "Platformgebruikers"
- Regel 570: "Openstaande Uitnodigingen" -> "Openstaande uitnodigingen"
- Regel 810: "Taaktypes Beheren" -> "Taaktypes beheren"
- Regel 813: "Types Beheren" -> "Types beheren"
- Regel 822: "Types Beheren" -> "Types beheren"

### 2. `src/pages/Auth.tsx`
- Regel 69: "Gebruikers Beheren" -> "Gebruikers beheren"

### 3. `src/pages/Dashboard.tsx`
- Regel 274: "Gebruikers Beheren" -> "Gebruikers beheren"

### 4. `src/components/AdminUsersDialog.tsx`
- Regel 133: "Gebruikers Beheren" -> "Gebruikers beheren"

### 5. `src/components/project/InviteProjectUserDialog.tsx`
- Regel 162, 245: "Kopieer Link" -> "Kopieer link"
- Regel 212, 264: "Projectgebruiker Uitnodigen" -> "Projectgebruiker uitnodigen"
- Regel 227: "Genereer Link" -> "Genereer link"

### 6. `src/components/project/ProjectUsersManager.tsx`
- Regel 70: "Projectgebruikers Beheren" -> "Projectgebruikers beheren"

### 7. `src/components/project/DocumentTypesManager.tsx`
- Regel 168: "Document Types Beheren" -> "Documenttypes beheren"

### 8. `src/components/admin/TaskTypesManager.tsx`
- Regel 191: "Taaktypes Beheren" -> "Taaktypes beheren"

## Samenvatting

19 tekstaanpassingen in 8 bestanden. Alle correcties volgen de Nederlandse spellingregel: alleen het eerste woord van een zin/kop krijgt een hoofdletter. Samenstellingen worden aan elkaar geschreven ("Documenttypes" i.p.v. "Document Types").

