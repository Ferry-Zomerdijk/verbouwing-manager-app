import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bath, ChefHat, Home, Hammer, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getTemplateById } from "@/lib/renovationTemplates";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "badkamer", label: "Badkamer verbouwen", icon: Bath },
  { id: "keuken", label: "Keuken verbouwen", icon: ChefHat },
  { id: "woning", label: "Complete woningrenovatie", icon: Home },
  { id: "aanbouw", label: "Aanbouw / uitbouw", icon: Hammer },
  { id: "leeg", label: "Vanaf nul beginnen", icon: PlusCircle },
];

interface Props { open: boolean; onDone: () => void }

/** Last onboarding step: start from a template or an empty environment. */
export function StartProjectChooser({ open, onDone }: Props) {
  const [choice, setChoice] = useState("leeg");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const start = async () => {
    if (choice === "leeg") return onDone();
    const tpl = getTemplateById(choice);
    if (!tpl) return onDone();
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");
      const { data: project, error } = await supabase.from("projects")
        .insert([{ user_id: user.id, naam: OPTIONS.find((o) => o.id === choice)!.label, type: "Verbouwing", status: "Gepland", totaal_begroting: 0, beschrijving: tpl.beschrijving }])
        .select().single();
      if (error) throw error;
      await supabase.from("tasks").insert(tpl.taken.map((t) => ({
        project_id: project.id, titel: t.titel, beschrijving: t.beschrijving, deel_van_huis: t.deel_van_huis, prioriteit: t.prioriteit, status: "Te doen" as const,
      })));
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Project aangemaakt met ${tpl.taken.length} taken`);
      onDone();
    } catch {
      toast.error("Project aanmaken mislukt");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDone()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hoe wil je beginnen?</DialogTitle>
          <DialogDescription>Kies een template met kant-en-klare taken, of begin met een lege omgeving.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {OPTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-pressed={choice === id} onClick={() => setChoice(id)}
              className={cn("flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                choice === id ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50")}>
              <Icon className="h-5 w-5 text-primary" /> <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
        <Button onClick={start} disabled={busy} className="w-full">{busy ? "Bezig..." : "Starten"}</Button>
      </DialogContent>
    </Dialog>
  );
}
