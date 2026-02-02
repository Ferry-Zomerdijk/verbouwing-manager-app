import confetti from "canvas-confetti";

export const triggerTaskCompletionConfetti = () => {
  // Safety: only run in browser
  if (typeof window === "undefined") return;

  // Ensure the confetti canvas sits above app UI layers (dialogs/headers/toasts)
  const common = {
    zIndex: 9999,
    // Force-enable even when OS/browser prefers reduced motion.
    // (Some environments/users reported confetti being suppressed otherwise.)
    disableForReducedMotion: false,
  } as const;

  // Burst from center
  try {
    confetti({
      ...common,
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22c55e", "#10b981", "#f59e0b", "#3b82f6"],
    });
  
    // Side cannons for extra celebration
    confetti({
      ...common,
      particleCount: 30,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#22c55e", "#10b981"],
    });
    confetti({
      ...common,
      particleCount: 30,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#22c55e", "#10b981"],
    });
  } catch (e) {
    // Don't break UX if confetti fails in some browsers/embeds
    console.warn("Confetti failed to render", e);
  }
};
