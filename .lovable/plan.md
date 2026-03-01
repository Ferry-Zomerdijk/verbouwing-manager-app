
# Plan: "Sleutelbeheer" tab hernoemen naar "Beheer" in UserManagement

## Probleem

In `src/pages/UserManagement.tsx` (de instellingen/admin pagina) staat op regel 475 nog de tab-tekst **"Sleutelbeheer"**. Dit hoort **"Beheer"** te zijn, consistent met de naamgeving in ProjectDetail.

**Overige vindplaatsen van "Sleutelbeheer":**
- `KeyManagement.tsx` regel 134: card-titel binnen de Beheer-sectie — dit is correct, want het beschrijft de subsectie "Sleutelbeheer" binnen Beheer
- `nl.ts` regel 447: `management.keys.title = "Sleutelbeheer"` — dit is de subsectie-titel, ook correct

Alleen de **tab-label** in UserManagement moet worden aangepast.

## Wijziging

| Bestand | Regel | Huidig | Nieuw |
|---------|-------|--------|-------|
| `src/pages/UserManagement.tsx` | 475 | `Sleutelbeheer` | `Beheer` |

Dit is een eenvoudige tekstaanpassing van 1 regel. Geen verdere wijzigingen nodig.
