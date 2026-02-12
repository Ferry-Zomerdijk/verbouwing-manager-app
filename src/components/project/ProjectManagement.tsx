import { useLanguage } from "@/contexts/LanguageContext";
import { KeyManagement } from "@/components/admin/KeyManagement";
import { MaintenanceInstructions } from "./MaintenanceInstructions";
import { HousePartsManager } from "./HousePartsManager";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Wrench, Key, Home } from "lucide-react";

interface ProjectManagementProps {
  projectId: string;
  isAdminOrOwner?: boolean;
}

export default function ProjectManagement({ projectId, isAdminOrOwner }: ProjectManagementProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["maintenance", "keys", "houseparts"]} className="space-y-4">
        <AccordionItem value="maintenance" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-semibold">
              <Wrench className="h-5 w-5" />
              {t.management.maintenance.title}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <MaintenanceInstructions projectId={projectId} isAdminOrOwner={isAdminOrOwner} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="keys" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-semibold">
              <Key className="h-5 w-5" />
              {t.management.keys.title}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <KeyManagement projectId={projectId} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="houseparts" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-semibold">
              <Home className="h-5 w-5" />
              {t.management.houseParts.title}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <HousePartsManager projectId={projectId} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
