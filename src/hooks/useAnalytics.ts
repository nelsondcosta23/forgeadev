import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get country info from localStorage (set by detect-country function)
const getCountryInfo = () => {
  try {
    const countryData = localStorage.getItem('detectedCountry');
    if (countryData) {
      const parsed = JSON.parse(countryData);
      return {
        country_code: parsed.code,
        country_name: parsed.name,
      };
    }
  } catch (error) {
    console.error('Error parsing country data:', error);
  }
  return {
    country_code: undefined,
    country_name: undefined,
  };
};

export const useAnalytics = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const previousPath = useRef<string>('');

  useEffect(() => {
    // Avoid tracking the same page twice
    if (location.pathname === previousPath.current) {
      return;
    }
    
    previousPath.current = location.pathname;

    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        const countryInfo = getCountryInfo();

        const event = {
          event_type: 'pageview',
          page_path: location.pathname,
          page_title: document.title,
          referrer: document.referrer || undefined,
          user_agent: navigator.userAgent,
          language: i18n.language,
          session_id: sessionId,
          ...countryInfo,
          metadata: {
            search: location.search,
            hash: location.hash,
          },
        };

        // Send to edge function
        await supabase.functions.invoke('track-analytics', {
          body: event,
        });

        console.log('Analytics event tracked:', event.page_path);
      } catch (error) {
        console.error('Error tracking analytics:', error);
      }
    };

    // Track after a small delay to ensure document.title is updated
    const timeoutId = setTimeout(trackPageView, 100);

    return () => clearTimeout(timeoutId);
  }, [location, i18n.language]);
};

// Custom event tracking function
export const trackEvent = async (
  eventType: string,
  metadata?: Record<string, any>
) => {
  try {
    const sessionId = getSessionId();
    const countryInfo = getCountryInfo();

    const event = {
      event_type: eventType,
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || undefined,
      user_agent: navigator.userAgent,
      language: document.documentElement.lang || 'en-US',
      session_id: sessionId,
      ...countryInfo,
      metadata,
    };

    await supabase.functions.invoke('track-analytics', {
      body: event,
    });

    console.log('Custom event tracked:', eventType);
  } catch (error) {
    console.error('Error tracking custom event:', error);
  }
};
