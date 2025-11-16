import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export const DynamicMetaTags = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // Update document title
    const title = t('meta.title');
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? 'name' : 'property';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Get current URL
    const currentUrl = window.location.origin + location.pathname;

    // Update basic meta tags
    updateMetaTag('title', t('meta.title'), true);
    updateMetaTag('description', t('meta.description'), true);

    // Update Open Graph tags
    updateMetaTag('og:title', t('meta.ogTitle'));
    updateMetaTag('og:description', t('meta.ogDescription'));
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:image', `${window.location.origin}/images/og-image.png`);
    updateMetaTag('og:locale', i18n.language);

    // Add alternate locales for SEO
    const locales = ['en-US', 'en-GB', 'pt-PT', 'pt-BR', 'es', 'fr', 'de'];
    const otherLocales = locales.filter(loc => loc !== i18n.language);
    
    // Remove existing alternate locale tags
    document.querySelectorAll('meta[property="og:locale:alternate"]').forEach(el => el.remove());
    
    // Add new alternate locale tags
    otherLocales.forEach(locale => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:locale:alternate');
      meta.setAttribute('content', locale);
      document.head.appendChild(meta);
    });

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', t('meta.twitterTitle'));
    updateMetaTag('twitter:description', t('meta.twitterDescription'));
    updateMetaTag('twitter:url', currentUrl);
    updateMetaTag('twitter:image', `${window.location.origin}/images/og-image.png`);

    // Update HTML lang attribute
    document.documentElement.lang = i18n.language.split('-')[0];

    // Add hreflang tags for international SEO
    // Remove existing hreflang links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    
    const languageMap: Record<string, string> = {
      'en-US': 'en-us',
      'en-GB': 'en-gb',
      'pt-PT': 'pt-pt',
      'pt-BR': 'pt-br',
      'es': 'es',
      'fr': 'fr',
      'de': 'de'
    };

    // Add hreflang for all available languages
    locales.forEach(locale => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', languageMap[locale] || locale.toLowerCase());
      link.setAttribute('href', currentUrl);
      document.head.appendChild(link);
    });

    // Add x-default hreflang (points to en-US version)
    const defaultLink = document.createElement('link');
    defaultLink.setAttribute('rel', 'alternate');
    defaultLink.setAttribute('hreflang', 'x-default');
    defaultLink.setAttribute('href', currentUrl);
    document.head.appendChild(defaultLink);

  }, [t, i18n.language, location.pathname]);

  return null;
};
