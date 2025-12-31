import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy, Link, Trash2, ExternalLink, Eye, Calendar, Loader2, QrCode, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SharePublicLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

const SharePublicLinkDialog = ({
  open,
  onOpenChange,
  projectId,
  projectName,
}: SharePublicLinkDialogProps) => {
  const [expiresInDays, setExpiresInDays] = useState<string>("never");
  const [expandedQRCode, setExpandedQRCode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch existing shares
  const { data: shares, isLoading: sharesLoading } = useQuery({
    queryKey: ["public-shares", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_project_shares")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Generate new share
  const generateMutation = useMutation({
    mutationFn: async () => {
      const days = expiresInDays === "never" ? null : parseInt(expiresInDays);
      
      const response = await supabase.functions.invoke("generate-public-share", {
        body: { projectId, expiresInDays: days },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["public-shares", projectId] });
      toast.success("Publieke link aangemaakt!");
      
      // Copy to clipboard
      navigator.clipboard.writeText(data.publicUrl);
      toast.info("Link gekopieerd naar klembord");
    },
    onError: (error: any) => {
      toast.error(error.message || "Fout bij aanmaken link");
    },
  });

  // Toggle share active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("public_project_shares")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-shares", projectId] });
      toast.success("Link status bijgewerkt");
    },
    onError: () => {
      toast.error("Fout bij bijwerken");
    },
  });

  // Delete share
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("public_project_shares")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-shares", projectId] });
      toast.success("Link verwijderd");
    },
    onError: () => {
      toast.error("Fout bij verwijderen");
    },
  });

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/public/project/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link gekopieerd naar klembord");
  };

  const openLink = (token: string) => {
    window.open(`${window.location.origin}/public/project/${token}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Deel Publieke Link
          </DialogTitle>
          <DialogDescription>
            Maak een publieke link aan waarmee bezoekers het project kunnen bekijken zonder in te loggen.
            Kosten en budget zijn niet zichtbaar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate new link section */}
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <h4 className="font-medium">Nieuwe link aanmaken</h4>
            
            <div className="space-y-2">
              <Label>Vervaldatum</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies verloop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Nooit</SelectItem>
                  <SelectItem value="7">7 dagen</SelectItem>
                  <SelectItem value="30">30 dagen</SelectItem>
                  <SelectItem value="90">90 dagen</SelectItem>
                  <SelectItem value="365">1 jaar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full gradient-primary"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aanmaken...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Link Aanmaken & Kopiëren
                </>
              )}
            </Button>
          </div>

          {/* Existing shares */}
          <div className="space-y-3">
            <h4 className="font-medium">Bestaande links</h4>

            {sharesLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                <Loader2 className="w-5 h-5 mx-auto animate-spin" />
              </div>
            ) : shares && shares.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {shares.map((share) => {
                  const isExpired = share.expires_at && new Date(share.expires_at) < new Date();
                  
                  return (
                    <div
                      key={share.id}
                      className={`p-3 border rounded-lg space-y-2 ${
                        !share.is_active || isExpired ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant={share.is_active && !isExpired ? "default" : "secondary"}
                            className="shrink-0"
                          >
                            {isExpired ? "Verlopen" : share.is_active ? "Actief" : "Inactief"}
                          </Badge>
                          <code className="text-xs font-mono text-muted-foreground truncate">
                            ...{share.share_token.slice(-8)}
                          </code>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setExpandedQRCode(expandedQRCode === share.id ? null : share.id)}
                            title="Toon QR-code"
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyLink(share.share_token)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openLink(share.share_token)}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(share.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* QR Code Section */}
                      {expandedQRCode === share.id && (
                        <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border">
                          <QRCodeSVG
                            value={`${window.location.origin}/public/project/${share.share_token}`}
                            size={160}
                            level="M"
                            includeMargin={true}
                          />
                          <p className="text-xs text-muted-foreground text-center">
                            Scan met je telefoon om het project te bekijken
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {share.view_count} bekeken
                          </span>
                          {share.expires_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(share.expires_at), "dd MMM yyyy", { locale: nl })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Actief</span>
                          <Switch
                            checked={share.is_active}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({ id: share.id, isActive: checked })
                            }
                            disabled={isExpired}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground text-sm">
                Nog geen publieke links aangemaakt
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePublicLinkDialog;
