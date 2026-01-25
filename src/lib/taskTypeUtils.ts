import { ShoppingCart, CheckSquare, Users, Settings, HelpCircle, Tag, LucideIcon } from "lucide-react";

// Icoon mapping voor taaktypes
export const taskTypeIconMap: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'check-square': CheckSquare,
  'users': Users,
  'settings': Settings,
  'help-circle': HelpCircle,
  'tag': Tag,
};

// Kleur mapping voor taaktype iconen
export const getTaskTypeIconColor = (kleur: string | null): string => {
  const colorMap: Record<string, string> = {
    blue: "text-blue-500",
    orange: "text-orange-500",
    purple: "text-purple-500",
    green: "text-green-500",
    yellow: "text-yellow-500",
    gray: "text-gray-500",
    red: "text-red-500",
    pink: "text-pink-500",
    cyan: "text-cyan-500",
  };
  return colorMap[kleur || "gray"] || "text-gray-500";
};

// Fallback icoon component
export const DefaultTaskTypeIcon = Tag;
