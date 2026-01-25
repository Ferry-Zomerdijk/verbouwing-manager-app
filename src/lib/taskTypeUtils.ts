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
