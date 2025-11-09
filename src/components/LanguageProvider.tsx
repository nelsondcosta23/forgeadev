import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { mapCountryToLanguage } from '@/i18n/config';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const detectAndSetLanguage = async () => {
      try {
        // Check if language is already set in localStorage
        const storedLanguage = localStorage.getItem('i18nextLng');
        if (storedLanguage && storedLanguage !== 'en-US') {
          console.log('Using stored language:', storedLanguage);
          setIsReady(true);
          return;
        }

        // Detect country via edge function
        const { data, error } = await supabase.functions.invoke('detect-country');
        
        if (error) {
          console.error('Error detecting country:', error);
          await i18n.changeLanguage('en-US');
          setIsReady(true);
          return;
        }

        const countryCode = data?.country_code;
        const language = mapCountryToLanguage(countryCode);
        
        console.log('Detected country:', countryCode, '-> Language:', language);
        
        await i18n.changeLanguage(language);
        localStorage.setItem('i18nextLng', language);
      } catch (error) {
        console.error('Error in language detection:', error);
        await i18n.changeLanguage('en-US');
      } finally {
        setIsReady(true);
      }
    };

    detectAndSetLanguage();
  }, [i18n]);

  if (!isReady) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};
