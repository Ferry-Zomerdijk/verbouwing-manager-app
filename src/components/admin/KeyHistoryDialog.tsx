import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, User, Calendar, ArrowRight, Loader2 } from "lucide-react";

interface KeyHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: string | null;
  keyNumber: string;
}

interface HistoryEntry {
  id: string;
  holder_name: string;
  received_at: string;
  returned_at: string | null;
  notes: string | null;
  created_at: string;
}

export function KeyHistoryDialog({
  open,
  onOpenChange,
  keyId,
  keyNumber,
}: KeyHistoryDialogProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["key-history", keyId],
    queryFn: async () => {
      if (!keyId) return [];
      const { data, error } = await supabase
        .from("key_history")
        .select("*")
        .eq("key_id", keyId)
        .order("received_at", { ascending: false });

      if (error) throw error;
      return data as HistoryEntry[];
    },
    enabled: !!keyId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Sleutelhistorie
          </DialogTitle>
          <DialogDescription>
            Overzicht van alle houders van sleutel{" "}
            <span className="font-semibold">{keyNumber}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Geen historie beschikbaar</p>
            <p className="text-sm mt-1">
              Historie wordt bijgehouden wanneer sleutels worden overgedragen
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="relative border rounded-lg p-4 bg-card"
                >
                  {/* Timeline connector */}
                  {index < history.length - 1 && (
                    <div className="absolute left-7 top-full h-3 w-0.5 bg-border" />
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{entry.holder_name}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.received_at), "d MMM yyyy", {
                            locale: nl,
                          })}
                        </div>

                        {entry.returned_at ? (
                          <>
                            <ArrowRight className="h-3 w-3" />
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(entry.returned_at), "d MMM yyyy", {
                                locale: nl,
                              })}
                            </div>
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Huidige houder
                          </Badge>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
