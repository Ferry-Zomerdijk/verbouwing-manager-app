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
}

const EditTaskDialog = ({ open, onOpenChange, task, onSuccess }: EditTaskDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titel: "",
    beschrijving: "",
    deadline: "",
    status: "Te doen",
    prioriteit: "Middel",
    verantwoordelijke: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        titel: task.titel || "",
        beschrijving: task.beschrijving || "",
        deadline: task.deadline || "",
        status: task.status || "Te doen",
        prioriteit: task.prioriteit || "Middel",
        verantwoordelijke: task.verantwoordelijke || "",
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          titel: formData.titel,
          beschrijving: formData.beschrijving || null,
          deadline: formData.deadline || null,
          status: formData.status as any,
          prioriteit: formData.prioriteit as any,
          verantwoordelijke: formData.verantwoordelijke || null,
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

          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
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
