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
          return;
        }

        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.functions.invoke('detect-country', {
          body: null,
        });

        if (controller.signal.aborted) return;

        if (error) {
          console.error('Error detecting country:', error);
          return;
        }

        const countryCode = data?.country_code;
        const language = mapCountryToLanguage(countryCode);
        console.log('Detected country:', countryCode, '-> Language:', language);
        await i18n.changeLanguage(language);
        localStorage.setItem('i18nextLng', language);
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          console.error('Error in language detection:', error);
        }
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
