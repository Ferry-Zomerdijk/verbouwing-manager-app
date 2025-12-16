import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Download, Pencil, Trash2, MapPin, FileText, Building2 } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EditCostDialog from "./EditCostDialog";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import type { Database } from "@/integrations/supabase/types";

type Cost = Database["public"]["Tables"]["costs"]["Row"];

interface MobileCostCardProps {
  cost: Cost;
  onUpdate: () => void;
}

const categoryColors: Record<string, string> = {
  Materiaal: "bg-blue-500",
  Arbeid: "bg-purple-500",
  Vergunningen: "bg-orange-500",
  Kluswerkzaamheden: "bg-green-500",
  Decoratie: "bg-pink-500",
  Meubels: "bg-amber-500",
  Overig: "bg-gray-500"
};

const statusColors: Record<string, string> = {
  Schatting: "bg-muted text-muted-foreground",
  Offerte: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Factuur: "bg-green-500/10 text-green-700 dark:text-green-400"
};

export const MobileCostCard = ({ cost, onUpdate }: MobileCostCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [swipeState, setSwipeState] = useState<"idle" | "left" | "right">("idle");

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (cost.factuur_url) {
        await supabase.storage.from("invoices").remove([cost.factuur_url]);
      }
      const { error } = await supabase.from("costs").delete().eq("id", cost.id);
      if (error) throw error;
      toast.success("Kosten verwijderd");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!cost.factuur_url) return;
    try {
      const { data, error } = await supabase.storage.from('invoices').download(cost.factuur_url);
      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factuur-${cost.id}.${cost.factuur_url.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Factuur gedownload");
    } catch (error) {
      toast.error("Fout bij downloaden factuur");
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      setSwipeState("left");
      setTimeout(() => {
        setDeleteDialogOpen(true);
        setSwipeState("idle");
      }, 150);
    },
    onSwipedRight: () => {
      setSwipeState("right");
      setTimeout(() => {
        setEditDialogOpen(true);
        setSwipeState("idle");
      }, 150);
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  return (
    <>
      <Card
        {...swipeHandlers}
        className={`p-4 transition-all duration-150 touch-pan-y active:bg-muted/50 ${
          swipeState === "left" ? "translate-x-[-20px] bg-destructive/5" : ""
        } ${swipeState === "right" ? "translate-x-[20px] bg-primary/5" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Main Content - Always Visible */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Amount and Status Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold">
                €{parseFloat(cost.bedrag.toString()).toLocaleString("nl-NL")}
              </span>
              <Badge className={`${statusColors[cost.status] || "bg-muted"} px-3 py-1`}>
                {cost.status}
              </Badge>
            </div>

            {/* Category and Date Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant="outline" 
                className={`${categoryColors[cost.categorie]} text-white border-0 text-xs px-3 py-1`}
              >
                {cost.categorie}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(cost.datum), "d MMM yyyy", { locale: nl })}
              </span>
            </div>

            {/* Leverancier - if present */}
            {cost.leverancier && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{cost.leverancier}</span>
              </div>
            )}
          </div>

          {/* Expand Button */}
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
            {expanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {cost.deel_van_huis && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{cost.deel_van_huis}</span>
              </div>
            )}

            {cost.beschrijving && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{cost.beschrijving}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {cost.factuur_url && (
                <Button 
                  variant="outline" 
                  className="h-11"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadInvoice();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Factuur
                </Button>
              )}
              <Button
                variant="outline"
                className="h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Bewerken
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive h-11 w-11"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <EditCostDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        cost={cost}
        onSuccess={onUpdate}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Kosten Verwijderen"
        description="Dit zal ook de bijbehorende factuur verwijderen indien aanwezig."
        itemName={`€${parseFloat(cost.bedrag.toString()).toLocaleString("nl-NL")}`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
};

export default MobileCostCard;
