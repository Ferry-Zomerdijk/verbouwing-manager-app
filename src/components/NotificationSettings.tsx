import { Bell, BellOff, Info, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePushSubscription } from "@/hooks/usePushSubscription";

export function NotificationSettings() {
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    isLoading, 
    toggle 
  } = usePushSubscription();

  if (!isSupported) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Push notificaties worden niet ondersteund door je browser.
        </AlertDescription>
      </Alert>
    );
  }

  const isBlocked = permission === 'denied';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="push-notifications" className="text-base font-medium">
              Push notificaties
            </Label>
            <p className="text-sm text-muted-foreground">
              Ontvang meldingen over taken en updates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={toggle}
            disabled={isLoading || isBlocked}
          />
        </div>
      </div>

      {isBlocked && (
        <Alert variant="destructive">
          <AlertDescription>
            Je hebt notificaties geblokkeerd. Klik op het slotje in de adresbalk om dit te wijzigen.
          </AlertDescription>
        </Alert>
      )}

      {isSubscribed && (
        <div className="pl-8 space-y-2 text-sm text-muted-foreground">
          <p>Je ontvangt notificaties voor:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Nieuwe taken die aan jou zijn toegewezen</li>
            <li>Updates op taken in je projecten</li>
            <li>Herinneringen voor naderende deadlines</li>
          </ul>
        </div>
      )}
    </div>
  );
}