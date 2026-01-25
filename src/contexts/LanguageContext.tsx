import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, UITexts } from '@/lib/i18n/types';
import { nl } from '@/lib/i18n/nl';
import { en } from '@/lib/i18n/en';

const translations: Record<Language, UITexts> = { nl, en };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: UITexts;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'nl' || stored === 'en') {
      return stored;
    }
    // Default to Dutch
    return 'nl';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // Update html lang attribute for accessibility
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Set initial lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Backward compatibility: export UI constant that uses the current language
// This allows gradual migration - existing code can still use `UI.x.y` 
// while new code uses the `useLanguage` hook
export { nl as UI } from '@/lib/i18n/nl';
