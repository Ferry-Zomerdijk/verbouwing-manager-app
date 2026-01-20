import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface UpdateState {
  updateAvailable: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  registration: ServiceWorkerRegistration | null;
}

export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>({
    updateAvailable: false,
    isChecking: false,
    lastChecked: null,
    registration: null,
  });

  // Listen for service worker updates
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        setState((prev) => ({
          ...prev,
          updateAvailable: true,
          registration,
        }));
      }
    };

    // Check existing registration
    navigator.serviceWorker.ready.then((registration) => {
      setState((prev) => ({ ...prev, registration }));

      // Check if there's already a waiting worker
      if (registration.waiting) {
        setState((prev) => ({ ...prev, updateAvailable: true }));
      }

      // Listen for new updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setState((prev) => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });
    });

    // Listen for controller change (update applied)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Reload the page when the new service worker takes control
      window.location.reload();
    });
  }, []);

  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator)) {
      return false;
    }

    setState((prev) => ({ ...prev, isChecking: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Force the service worker to check for updates
      await registration.update();

      setState((prev) => ({
        ...prev,
        isChecking: false,
        lastChecked: new Date(),
        registration,
      }));

      // Check if there's a waiting worker
      if (registration.waiting) {
        setState((prev) => ({ ...prev, updateAvailable: true }));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking for updates:", error);
      setState((prev) => ({
        ...prev,
        isChecking: false,
        lastChecked: new Date(),
      }));
      return false;
    }
  }, []);

  const applyUpdate = useCallback(() => {
    const { registration } = state;
    
    if (!registration?.waiting) {
      toast.error("Geen update beschikbaar om te installeren");
      return;
    }

    // Tell the waiting service worker to skip waiting and become active
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    
    toast.success("Update wordt geïnstalleerd...");
  }, [state]);

  const getLastCheckedText = useCallback((): string => {
    if (!state.lastChecked) return "Nog niet gecontroleerd";
    
    const now = new Date();
    const diff = now.getTime() - state.lastChecked.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Zojuist gecontroleerd";
    if (minutes === 1) return "1 minuut geleden";
    if (minutes < 60) return `${minutes} minuten geleden`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 uur geleden";
    if (hours < 24) return `${hours} uur geleden`;
    
    return state.lastChecked.toLocaleDateString("nl-NL");
  }, [state.lastChecked]);

  return {
    updateAvailable: state.updateAvailable,
    isChecking: state.isChecking,
    lastChecked: state.lastChecked,
    checkForUpdate,
    applyUpdate,
    getLastCheckedText,
  };
}
