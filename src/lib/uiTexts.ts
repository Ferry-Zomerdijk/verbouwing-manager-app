/**
 * Centrale UI teksten voor consistente spelling en vertalingen
 * 
 * NIEUW: Voor meertalige ondersteuning, gebruik de `useLanguage` hook:
 * 
 * ```tsx
 * import { useLanguage } from '@/contexts/LanguageContext';
 * 
 * const MyComponent = () => {
 *   const { t } = useLanguage();
 *   return <button>{t.actions.save}</button>;
 * };
 * ```
 * 
 * De `UI` export hieronder blijft beschikbaar voor backward compatibility
 * maar geeft altijd Nederlandse teksten terug.
 * 
 * @deprecated Gebruik `useLanguage` hook voor nieuwe code
 */

// Re-export from the new i18n system for backward compatibility
export { nl as UI } from '@/lib/i18n/nl';
export type { UITexts } from '@/lib/i18n/types';
