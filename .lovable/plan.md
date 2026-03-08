

# Hardcoded Nederlandse teksten centraliseren naar i18n-systeem

## Omvang van het probleem

Na grondige analyse van de codebase:

- **85+ bestanden** bevatten hardcoded Nederlandse teksten
- **55 bestanden** bevatten hardcoded Nederlandse toast-berichten
- Slechts **21 bestanden** gebruiken al de `useLanguage` hook
- **18 bestanden** gebruiken de verouderde `UI` import (geeft altijd Nederlands)

Dit is een groot migratieproject. Hieronder een gefaseerde aanpak, beginnend met de meest impactvolle gebieden.

---

## Fase 1: i18n types uitbreiden

Nieuwe secties toevoegen aan `src/lib/i18n/types.ts`, `nl.ts` en `en.ts` voor teksten die nu nog ontbreken:

### Nieuwe keys toevoegen

```text
account: {
  title: string;                    // "Accountinstellingen" / "Account settings"
  profile: string;                  // "Profiel" / "Profile"
  password: string;                 // "Wachtwoord" / "Password"
  pin: string;                      // "Pincode" / "PIN"
  messages: {
    profileUpdated: string;         // "Profiel bijgewerkt"
    passwordChanged: string;        // "Wachtwoord succesvol gewijzigd"
    passwordMinLength: string;      // "Wachtwoord moet minimaal 6 tekens zijn"
    passwordMismatch: string;       // "Wachtwoorden komen niet overeen"
    pinRemoved: string;             // "Pincode verwijderd"
    pinMustBe6: string;             // "Pincode moet 6 cijfers zijn"
    pinMismatch: string;            // "Pincodes komen niet overeen"
    enterPassword: string;          // "Vul je huidige wachtwoord in"
    upToDate: string;               // "Je hebt de nieuwste versie!"
    saveError: string;              // "Fout bij opslaan"
  };
};

auth: {
  login: string;                    // "Inloggen" / "Log in"
  register: string;                 // "Registreren" / "Register"
  forgotPassword: string;           // "Wachtwoord vergeten?" / "Forgot password?"
  resetPassword: string;            // "Wachtwoord resetten" / "Reset password"
  noAccount: string;                // "Nog geen account? Registreer hier"
  hasAccount: string;               // "Al een account? Log in"
  resetSent: string;                // "Wachtwoord reset email verzonden!"
  messages: {
    loginFailed: string;
    registerFailed: string;
  };
};

sharing: {
  publicLink: string;               // "Publieke link"
  copyLink: string;                 // "Kopieer link"
  generateLink: string;             // "Genereer link"
  linkCopied: string;               // "Link gekopieerd"
  messages: {
    created: string;                // "Publieke link aangemaakt!"
    updated: string;                // "Link status bijgewerkt"
    deleted: string;                // "Link verwijderd"
    noLinks: string;                // "Nog geen publieke links aangemaakt"
  };
};

invitations: {
  title: string;                    // "Uitnodigingen"
  pending: string;                  // "Openstaande uitnodigingen"
  messages: {
    canceled: string;               // "Uitnodiging geannuleerd"
    linkCopied: string;             // "Uitnodigingslink gekopieerd"
    emailSent: string;              // "Uitnodigingsemail verzonden"
    resendFailed: string;           // "Kon uitnodiging niet opnieuw versturen"
  };
};

webhooks: {
  noEvents: string;                 // "Nog geen webhook events ontvangen"
};

keys: {
  messages: {
    noKeys: string;                 // "Nog geen sleutels geregistreerd"
    confirmDelete: string;          // "Weet je zeker dat je sleutel ... wilt verwijderen?"
  };
};
```

## Fase 2: Hoogste-impact bestanden migreren (20 bestanden)

Deze bestanden bevatten de meeste hardcoded teksten en worden het vaakst door gebruikers gezien:

| Bestand | Aantal hardcoded strings | Actie |
|---------|------------------------|-------|
| `UserManagement.tsx` | ~25 | `useLanguage` toevoegen, alle strings vervangen |
| `AccountSettingsDialog.tsx` | ~15 | `useLanguage` toevoegen |
| `Auth.tsx` | ~12 | `useLanguage` toevoegen |
| `Dashboard.tsx` | ~10 | `useLanguage` toevoegen |
| `ProjectPhotos.tsx` | ~10 | `useLanguage` toevoegen |
| `ProjectDocuments.tsx` | ~8 | `useLanguage` toevoegen |
| `ProjectCosts.tsx` | ~10 | `useLanguage` toevoegen |
| `ProjectOverview.tsx` | ~8 | `useLanguage` toevoegen |
| `ProjectContacts.tsx` | ~8 | `useLanguage` toevoegen |
| `ProjectAttendance.tsx` | ~6 | `useLanguage` toevoegen |
| `SharePublicLinkDialog.tsx` | ~8 | `useLanguage` toevoegen |
| `KeyManagement.tsx` | ~10 | `useLanguage` toevoegen |
| `WebhookHealthMonitor.tsx` | ~5 | `useLanguage` toevoegen |
| `OnboardingModal.tsx` | ~6 | `useLanguage` toevoegen |
| `TaskCard.tsx` | ~5 | `useLanguage` toevoegen |
| `MobileTaskList.tsx` | ~5 | `useLanguage` toevoegen |
| `ProjectTasksWithDnd.tsx` | ~8 | `useLanguage` toevoegen |
| `AttendanceDialog.tsx` | ~6 | `useLanguage` toevoegen |
| `TaskUpdatesSection.tsx` | ~5 | `useLanguage` toevoegen |
| `Pricing.tsx` | ~8 | `useLanguage` toevoegen |

## Fase 3: Verouderde `UI` imports migreren (18 bestanden)

De 18 bestanden die `import { UI } from "@/lib/uiTexts"` gebruiken worden omgezet naar `useLanguage`:

```text
// Oud (statisch Nederlands):
import { UI } from "@/lib/uiTexts";
<button>{UI.actions.save}</button>

// Nieuw (dynamisch meertalig):
const { t } = useLanguage();
<button>{t.actions.save}</button>
```

Betreft: `CreateProjectDialog`, `EditProjectDialog`, `CreateTaskDialog`, `EditTaskDialog`, `CreateCostDialog`, `EditCostDialog`, `CreateContractorDialog`, `EditContractorDialog`, `CreateContactDialog`, `EditContactDialog`, `CreateCategoryDialog`, `EditCategoryDialog`, `CreatePlatformUserDialog`, `DeleteConfirmationDialog`, `InviteProjectUserDialog`, `MobileTaskWizard`, `ProjectContractors`, `ProjectTasks`.

## Fase 4: Statische pagina's (buiten scope, aparte taak)

Pagina's als `PrivacyPolicy.tsx`, `TermsOfService.tsx`, `CheckoutSuccess.tsx` en de landing page componenten bevatten grote blokken hardcoded tekst. Deze vereisen een aparte aanpak (mogelijk met lange tekst-blokken in de i18n bestanden of markdown). Dit wordt als aparte taak gepland.

---

## Aanpak per bestand (patroon)

Voor elk bestand:

1. Voeg `import { useLanguage } from "@/contexts/LanguageContext"` toe
2. Voeg `const { t } = useLanguage()` toe in de component
3. Vervang alle hardcoded strings door `t.xxx.yyy` referenties
4. Verwijder eventuele `import { UI } from "@/lib/uiTexts"`

## Samenvatting

- **Fase 1**: 3 bestanden aanpassen (types, nl, en) - nieuwe i18n keys
- **Fase 2**: 20 bestanden migreren naar `useLanguage`
- **Fase 3**: 18 bestanden omzetten van `UI` naar `useLanguage`
- **Totaal**: ~41 bestanden, ~200+ string-vervangingen

Gezien de omvang stel ik voor om fase 1 + fase 2 (de 20 meest impactvolle bestanden) in deze ronde te doen, en fase 3 als vervolgstap.

