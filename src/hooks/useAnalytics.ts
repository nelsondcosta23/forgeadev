import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Generate or retrieve session ID
const getSessionId = (): string => {
  try {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  } catch {
    // Storage may be blocked in privacy/sandboxed contexts
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Get country info from localStorage or detect via IP
const getCountryInfo = async () => {
  try {
    // 1. Try localStorage first (cached)
    const cached = localStorage.getItem('detectedCountry');
    if (cached) {
      const parsed = JSON.parse(cached);
      // Check if cache is fresh (less than 24 hours)
      if (Date.now() - (parsed.timestamp || 0) < 86400000) {
        return {
          country_code: parsed.code,
          country_name: parsed.name,
        };
      }
    }

    // 2. Detect via IP if not cached or stale
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    
    if (data.country_code && data.country_name) {
      const countryData = {
        code: data.country_code,
        name: data.country_name,
        timestamp: Date.now()
      };
      localStorage.setItem('detectedCountry', JSON.stringify(countryData));
      return {
        country_code: data.country_code,
        country_name: data.country_name,
      };
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Geolocation detection failed:', error);
    }
  }
  return {
    country_code: 'Unknown',
    country_name: 'Unknown',
  };
};

const invokeTrackAnalytics = async (event: Record<string, unknown>) => {
  return fetch('/api/analytics/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': import.meta.env.VITE_INTERNAL_PROXY_KEY || '',
    },
    body: JSON.stringify(event),
  }).then(res => res.json());
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
        const countryInfo = await getCountryInfo();

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

        await invokeTrackAnalytics(event);
        console.log('Analytics event tracked:', event.page_path, countryInfo.country_code);
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
    const countryInfo = await getCountryInfo();

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

    await invokeTrackAnalytics(event);
    console.log('Custom event tracked:', eventType);
  } catch (error) {
    console.error('Error tracking custom event:', error);
  }
};
