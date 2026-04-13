import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { mapCountryToLanguage } from '@/i18n/config';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const detectAndSetLanguage = async () => {
      try {
        const storedLanguage = localStorage.getItem('i18nextLng');
        if (storedLanguage && storedLanguage !== 'en-US') {
          console.log('[LanguageProvider] Using stored language:', storedLanguage);
          await i18n.changeLanguage(storedLanguage);
          return;
        }

        // Default to PT but ensure it actually changes
        const language = 'pt-PT';
        console.log('[LanguageProvider] Fallback language set to:', language);
        await i18n.changeLanguage(language);
        localStorage.setItem('i18nextLng', language);
      } catch (error) {
        console.error('[LanguageProvider] Error setting language, forcing pt-PT:', error);
        await i18n.changeLanguage('pt-PT').catch(() => {});
      } finally {
        clearTimeout(timeoutId);
      }
    };

    detectAndSetLanguage();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [i18n]);

  return <>{children}</>;
};
