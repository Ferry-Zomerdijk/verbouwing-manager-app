import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TaskUpdatesSection from "./TaskUpdatesSection";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onSuccess: () => void;
  availableDelenVanHuis?: string[];
}

const EditTaskDialog = ({ open, onOpenChange, task, onSuccess, availableDelenVanHuis = [] }: EditTaskDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [customDeelVanHuis, setCustomDeelVanHuis] = useState("");
  const [formData, setFormData] = useState({
    titel: "",
    beschrijving: "",
    begindatum: "",
    deadline: "",
    status: "Te doen",
    prioriteit: "Middel",
    verantwoordelijke: "",
    deel_van_huis: "",
  });

  useEffect(() => {
    if (task) {
      const deelVanHuis = task.deel_van_huis || "";
      const isExisting = availableDelenVanHuis.includes(deelVanHuis);
      
      setFormData({
        titel: task.titel || "",
        beschrijving: task.beschrijving || "",
        begindatum: task.begindatum || "",
        deadline: task.deadline || "",
        status: task.status || "Te doen",
        prioriteit: task.prioriteit || "Middel",
        verantwoordelijke: task.verantwoordelijke || "",
        deel_van_huis: deelVanHuis && !isExisting && deelVanHuis !== "" ? "__custom__" : deelVanHuis,
      });
      
      if (deelVanHuis && !isExisting && deelVanHuis !== "") {
        setCustomDeelVanHuis(deelVanHuis);
      } else {
        setCustomDeelVanHuis("");
      }
    }
  }, [task, availableDelenVanHuis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalDeelVanHuis = formData.deel_van_huis === "__custom__" 
      ? customDeelVanHuis 
      : formData.deel_van_huis === "__none__"
      ? null
      : formData.deel_van_huis;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          titel: formData.titel,
          beschrijving: formData.beschrijving || null,
          begindatum: formData.begindatum || null,
          deadline: formData.deadline || null,
          status: formData.status as any,
          prioriteit: formData.prioriteit as any,
          verantwoordelijke: formData.verantwoordelijke || null,
          deel_van_huis: finalDeelVanHuis || null,
        })
        .eq("id", task.id);

      if (error) throw error;

      toast.success("Taak bijgewerkt");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Taak Bewerken</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titel">Titel *</Label>
            <Input
              id="titel"
              value={formData.titel}
              onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
              placeholder="Taak titel"
              required
            />
          </div>

          <div>
            <Label htmlFor="beschrijving">Beschrijving</Label>
            <Textarea
              id="beschrijving"
              value={formData.beschrijving}
              onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
              placeholder="Taak beschrijving..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prioriteit">Prioriteit</Label>
              <Select
                value={formData.prioriteit}
                onValueChange={(value) => setFormData({ ...formData, prioriteit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laag">Laag</SelectItem>
                  <SelectItem value="Middel">Middel</SelectItem>
                  <SelectItem value="Hoog">Hoog</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Te doen">Te doen</SelectItem>
                  <SelectItem value="Bezig">Bezig</SelectItem>
                  <SelectItem value="Gereed">Gereed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="begindatum">Begindatum</Label>
              <Input
                id="begindatum"
                type="date"
                value={formData.begindatum}
                onChange={(e) => {
                  const newBegindatum = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    begindatum: newBegindatum,
                    deadline: prev.deadline || newBegindatum
                  }));
                }}
              />
            </div>

            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deel_van_huis">Deel van huis</Label>
            <Select
              value={formData.deel_van_huis || "__none__"}
              onValueChange={(value) => setFormData({ ...formData, deel_van_huis: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer of voer nieuw in" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Geen</SelectItem>
                {availableDelenVanHuis.map((deel) => (
                  <SelectItem key={deel} value={deel}>{deel}</SelectItem>
                ))}
                <SelectItem value="__custom__">+ Nieuw toevoegen...</SelectItem>
              </SelectContent>
            </Select>
            {formData.deel_van_huis === "__custom__" && (
              <Input
                className="mt-2"
                value={customDeelVanHuis}
                onChange={(e) => setCustomDeelVanHuis(e.target.value)}
                placeholder="Voer nieuw deel van huis in"
              />
            )}
          </div>

          <div>
            <Label htmlFor="verantwoordelijke">Verantwoordelijke</Label>
            <Input
              id="verantwoordelijke"
              value={formData.verantwoordelijke}
              onChange={(e) => setFormData({ ...formData, verantwoordelijke: e.target.value })}
              placeholder="Naam van verantwoordelijke"
            />
          </div>

          <Separator className="my-4" />

          {/* Updates Section */}
          {task?.id && (
            <TaskUpdatesSection taskId={task.id} onUpdateAdded={onSuccess} />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading} className="gradient-primary">
              {loading ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
