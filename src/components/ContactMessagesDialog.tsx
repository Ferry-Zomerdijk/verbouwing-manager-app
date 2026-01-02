import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Mail,
  Trash2,
  CheckCircle,
  Circle,
  RefreshCw,
  MessageSquare,
  User,
  Calendar,
} from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ContactMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContactMessagesDialog = ({
  open,
  onOpenChange,
}: ContactMessagesDialogProps) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null
  );

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error("Kon berichten niet laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMessages();
    }
  }, [open]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
      );
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, is_read: true });
      }
    } catch (error: any) {
      console.error("Error marking as read:", error);
      toast.error("Kon bericht niet als gelezen markeren");
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      toast.success("Bericht verwijderd");
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast.error("Kon bericht niet verwijderen");
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contactberichten
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} nieuw</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMessages}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 h-[60vh]">
          {/* Message List */}
          <div className="md:col-span-1 border rounded-lg overflow-hidden">
            <ScrollArea className="h-full">
              {messages.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {loading ? "Laden..." : "Geen berichten"}
                </div>
              ) : (
                <div className="divide-y">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.is_read) {
                          markAsRead(message.id);
                        }
                      }}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedMessage?.id === message.id ? "bg-muted" : ""
                      } ${!message.is_read ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {message.is_read ? (
                          <CheckCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-primary fill-primary mt-0.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm truncate ${
                              !message.is_read ? "font-semibold" : ""
                            }`}
                          >
                            {message.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {message.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(message.created_at), "d MMM HH:mm", {
                              locale: nl,
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Message Detail */}
          <div className="md:col-span-2 border rounded-lg p-4 overflow-hidden">
            {selectedMessage ? (
              <div className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{selectedMessage.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="hover:text-primary hover:underline"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-4 h-4" />
                      {format(
                        new Date(selectedMessage.created_at),
                        "d MMMM yyyy 'om' HH:mm",
                        { locale: nl }
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-auto">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground mt-1" />
                    <span className="font-medium text-sm">Bericht:</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="default"
                    className="gradient-primary"
                    onClick={() => {
                      window.location.href = `mailto:${selectedMessage.email}?subject=Re: Contact via De Renovatie App`;
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Beantwoorden
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Selecteer een bericht om te lezen</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
