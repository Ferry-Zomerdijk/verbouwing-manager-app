// App version information
export const APP_VERSION = "1.1.0";

// Build date is injected by vite.config.ts at build time
declare const __BUILD_DATE__: string;
export const BUILD_DATE = typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : new Date().toISOString();

// Generate a unique build identifier from the build date (MMDD.HHmm format)
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

// Get formatted build date
export function getFormattedBuildDate(): string {
  try {
    return new Date(BUILD_DATE).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return BUILD_DATE;
  }
}

// Platform detection
export type PlatformType = "pwa" | "native-ios" | "native-android" | "browser";

export function getPlatformInfo(): { type: PlatformType; displayName: string } {
  // Check for Capacitor native app
  const capacitor = (window as any).Capacitor;
  if (capacitor?.isNativePlatform?.()) {
    const platform = capacitor.getPlatform?.();
    if (platform === "ios") {
      return { type: "native-ios", displayName: "Native App (iOS)" };
    }
    if (platform === "android") {
      return { type: "native-android", displayName: "Native App (Android)" };
    }
  }

  // Check for PWA (standalone mode)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = (navigator as any).standalone === true;
  
  if (isStandalone || isIOSStandalone) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      return { type: "pwa", displayName: "PWA (iOS)" };
    }
    if (isAndroid) {
      return { type: "pwa", displayName: "PWA (Android)" };
    }
    return { type: "pwa", displayName: "PWA" };
  }

  // Regular browser
  return { type: "browser", displayName: "Browser" };
}

// Changelog entries - voeg hier nieuwe releases toe (nieuwste bovenaan)
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
      "Drawer nu altijd schermvullend op mobiel",
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
