import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS_NL = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}

export function MonthPicker({ value, onChange, placeholder }: MonthPickerProps) {
  const { language, t } = useLanguage();
  const months = language === "nl" ? MONTHS_NL : MONTHS_EN;

  return (
    <Select
      value={value !== null ? String(value) : ""}
      onValueChange={(v) => onChange(v ? parseInt(v) : null)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder || (language === "nl" ? "Selecteer maand" : "Select month")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          {language === "nl" ? "Selecteer maand" : "Select month"}
        </SelectItem>
        {months.map((month, i) => (
          <SelectItem key={i + 1} value={String(i + 1)}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getMonthName(month: number, language: string): string {
  const months = language === "nl" ? MONTHS_NL : MONTHS_EN;
  return months[month - 1] || "";
}
