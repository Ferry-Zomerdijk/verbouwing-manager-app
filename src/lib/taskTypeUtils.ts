import { ShoppingBag, ListTodo, MessageCircle, Wrench, Search, MoreHorizontal, LucideIcon } from "lucide-react";

// Icoon mapping voor taaktypes - elk icoon is visueel onderscheidend
export const taskTypeIconMap: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingBag,    // Kopen - boodschappentas
  'check-square': ListTodo,        // Te doen - takenlijst
  'users': MessageCircle,          // Overleg - communicatie
  'settings': Wrench,              // Regelen - praktisch/gereedschap
  'help-circle': Search,           // Opvragen - informatie zoeken
  'tag': MoreHorizontal,           // Anders - overig
};

// Default icon voor fallback
export const DefaultTaskTypeIcon = MoreHorizontal;

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

// Badge klassen voor taaktype met achtergrond
export const getTaskTypeBadgeClass = (kleur: string | null): string => {
  const colorMap: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    green: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
    yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    gray: "border-gray-500/30 bg-gray-500/10 text-gray-600 dark:text-gray-400",
    red: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    pink: "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  };
  return colorMap[kleur || "gray"] || colorMap.gray;
};
