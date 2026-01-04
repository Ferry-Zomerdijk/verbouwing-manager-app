import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncOfflineChanges } from '@/lib/syncService';
import { getQueueLength } from '@/lib/offlineQueue';

interface OnlineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  triggerSync: () => Promise<void>;
}

const OnlineContext = createContext<OnlineContextType>({
  isOnline: true,
  isSyncing: false,
  pendingChanges: 0,
  triggerSync: async () => {},
});

interface OnlineProviderProps {
  children: ReactNode;
}

export function OnlineProvider({ children }: OnlineProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(getQueueLength());
  const queryClient = useQueryClient();

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncOfflineChanges();
      setPendingChanges(getQueueLength());
      // Invalidate all queries to refresh data from server
      await queryClient.invalidateQueries();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, queryClient]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  // Update pending changes count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingChanges(getQueueLength());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <OnlineContext.Provider value={{ isOnline, isSyncing, pendingChanges, triggerSync }}>
      {children}
    </OnlineContext.Provider>
  );
}

export const useOnlineStatus = () => useContext(OnlineContext);
