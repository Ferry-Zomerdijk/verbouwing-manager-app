// App version information
export const APP_VERSION = "1.0.0";

// Build date is injected by vite.config.ts at build time
// The __BUILD_DATE__ variable is replaced with the actual build date
declare const __BUILD_DATE__: string;
export const BUILD_DATE = typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : new Date().toISOString();

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
