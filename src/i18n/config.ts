import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enUS from './locales/en-US.json';
import enGB from './locales/en-GB.json';
import ptPT from './locales/pt-PT.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: enUS },
      'en-GB': { translation: enGB },
      'pt-PT': { translation: ptPT },
      'pt-BR': { translation: ptBR },
      'es': { translation: es },
      'fr': { translation: fr },
      'de': { translation: de },
    },
    fallbackLng: 'en-US',
    lng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

export const mapCountryToLanguage = (countryCode: string | null): string => {
  if (!countryCode) return 'en-US';
  
  const mapping: Record<string, string> = {
    PT: 'pt-PT',
    BR: 'pt-BR',
    ES: 'es',
    GB: 'en-GB',
    US: 'en-US',
    FR: 'fr',
    DE: 'de',
    AT: 'de',
    CH: 'de',
    MX: 'es',
    AR: 'es',
    CO: 'es',
    CL: 'es',
    PE: 'es',
    VE: 'es',
    EC: 'es',
    GT: 'es',
    CU: 'es',
    BO: 'es',
    DO: 'es',
    HN: 'es',
    PY: 'es',
    SV: 'es',
    NI: 'es',
    CR: 'es',
    PA: 'es',
    UY: 'es',
  };
  
  return mapping[countryCode.toUpperCase()] || 'en-US';
};
