import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CloudOff, RefreshCw, Check, AlertCircle } from "lucide-react";
import { getQueue, getQueueLength } from "@/lib/offlineQueue";
import { syncOfflineChanges } from "@/lib/syncService";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export function SyncIndicator() {
  const { isOnline } = useOnlineStatus();
  const [queueLength, setQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ success: number; failed: number } | null>(null);
  const [queueItems, setQueueItems] = useState<ReturnType<typeof getQueue>>([]);

  // Poll queue length
  useEffect(() => {
    const updateQueue = () => {
      setQueueLength(getQueueLength());
      setQueueItems(getQueue());
    };

    updateQueue();
    const interval = setInterval(updateQueue, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queueLength > 0 && !isSyncing) {
      handleSync();
    }
  }, [isOnline]);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncOfflineChanges();
      setLastSyncResult(result);
      setQueueLength(getQueueLength());
      setQueueItems(getQueue());
      
      // Clear result after 3 seconds
      setTimeout(() => setLastSyncResult(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const getTableLabel = (table: string) => {
    const labels: Record<string, string> = {
      tasks: "Taak",
      costs: "Kosten",
      contractors: "Aannemer",
      documents: "Document",
      photos: "Foto",
      task_updates: "Update",
    };
    return labels[table] || table;
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      insert: "Toevoegen",
      update: "Wijzigen",
      delete: "Verwijderen",
    };
    return labels[type] || type;
  };

  // Don't show if online and no pending changes
  if (isOnline && queueLength === 0 && !lastSyncResult) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`
                shadow-lg border-2 gap-2
                ${!isOnline ? "border-amber-500 bg-amber-500/10" : ""}
                ${queueLength > 0 && isOnline ? "border-primary bg-primary/10" : ""}
                ${lastSyncResult?.success ? "border-green-500 bg-green-500/10" : ""}
                ${lastSyncResult?.failed ? "border-red-500 bg-red-500/10" : ""}
              `}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : !isOnline ? (
                <CloudOff className="h-4 w-4 text-amber-600" />
              ) : lastSyncResult?.success ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : lastSyncResult?.failed ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              
              {queueLength > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`
                    text-xs px-1.5 py-0
                    ${!isOnline ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"}
                  `}
                >
                  {queueLength}
                </Badge>
              )}
              
              <span className="text-xs hidden sm:inline">
                {isSyncing
                  ? "Synchroniseren..."
                  : !isOnline
                  ? "Offline"
                  : lastSyncResult?.success
                  ? `${lastSyncResult.success} gesync'd`
                  : lastSyncResult?.failed
                  ? `${lastSyncResult.failed} mislukt`
                  : queueLength > 0
                  ? "Wachtend"
                  : "Sync"}
              </span>
            </Button>
          </PopoverTrigger>
          
          <PopoverContent align="end" className="w-80">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Synchronisatie</h4>
                <Badge variant={isOnline ? "default" : "secondary"}>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>

              {queueLength === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Alle wijzigingen zijn gesynchroniseerd.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {queueLength} wijziging{queueLength !== 1 ? "en" : ""} wacht{queueLength === 1 ? "" : "en"} op synchronisatie.
                  </p>
                  
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {queueItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs p-2 rounded bg-muted/50 flex justify-between items-center"
                      >
                        <span>
                          <span className="font-medium">{getTableLabel(item.table)}</span>
                          {" - "}
                          <span className="text-muted-foreground">{getActionLabel(item.type)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {format(new Date(item.timestamp), "HH:mm", { locale: nl })}
                        </span>
                      </div>
                    ))}
                    {queueItems.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{queueItems.length - 5} meer...
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSync}
                    disabled={!isOnline || isSyncing}
                    size="sm"
                    className="w-full"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Bezig met synchroniseren...
                      </>
                    ) : !isOnline ? (
                      <>
                        <CloudOff className="h-4 w-4 mr-2" />
                        Wachten op verbinding...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Nu synchroniseren
                      </>
                    )}
                  </Button>
                </>
              )}

              {lastSyncResult && (
                <div className={`text-xs p-2 rounded ${
                  lastSyncResult.failed > 0 
                    ? "bg-red-500/10 text-red-700 dark:text-red-400" 
                    : "bg-green-500/10 text-green-700 dark:text-green-400"
                }`}>
                  {lastSyncResult.success > 0 && (
                    <p>✓ {lastSyncResult.success} wijziging{lastSyncResult.success !== 1 ? "en" : ""} gesynchroniseerd</p>
                  )}
                  {lastSyncResult.failed > 0 && (
                    <p>✗ {lastSyncResult.failed} wijziging{lastSyncResult.failed !== 1 ? "en" : ""} mislukt</p>
                  )}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </motion.div>
    </AnimatePresence>
  );
}