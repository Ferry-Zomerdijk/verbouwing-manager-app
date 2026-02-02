import confetti from "canvas-confetti";

export const triggerTaskCompletionConfetti = () => {
  // Burst from center
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#10b981", "#f59e0b", "#3b82f6"],
  });
  
  // Side cannons for extra celebration
  confetti({
    particleCount: 30,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: ["#22c55e", "#10b981"],
  });
  confetti({
    particleCount: 30,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: ["#22c55e", "#10b981"],
  });
};
