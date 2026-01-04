import { WifiOff, RefreshCw, Check, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingChanges } = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <WifiOff className="h-4 w-4" />
          <span>
            Je bent offline
            {pendingChanges > 0 && ` - ${pendingChanges} wijziging(en) wachten op sync`}
          </span>
        </motion.div>
      )}
      
      {isOnline && isSyncing && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Gegevens worden gesynchroniseerd...</span>
        </motion.div>
      )}

      {isOnline && !isSyncing && pendingChanges > 0 && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <CloudOff className="h-4 w-4" />
          <span>{pendingChanges} wijziging(en) konden niet worden gesynchroniseerd</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Smaller badge version for use in headers
export function OfflineBadge() {
  const { isOnline, pendingChanges } = useOnlineStatus();

  if (isOnline && pendingChanges === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs">
      {!isOnline ? (
        <span className="flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          <WifiOff className="h-3 w-3" />
          Offline
        </span>
      ) : pendingChanges > 0 ? (
        <span className="flex items-center gap-1 text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
          <CloudOff className="h-3 w-3" />
          {pendingChanges} pending
        </span>
      ) : null}
    </div>
  );
}
