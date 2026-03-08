// Centralized currency mapping - used by Quiz.tsx and edge functions
// Note: Edge functions cannot import from src/, so supabase/functions/analyze-quiz/index.ts
// maintains its own copy. Keep both in sync.

export interface CurrencyInfo {
  symbol: string;
  code: string;
}

export const currencyMap: Record<string, CurrencyInfo> = {
  PT: { symbol: '€', code: 'EUR' },
  ES: { symbol: '€', code: 'EUR' },
  FR: { symbol: '€', code: 'EUR' },
  DE: { symbol: '€', code: 'EUR' },
  IT: { symbol: '€', code: 'EUR' },
  NL: { symbol: '€', code: 'EUR' },
  BE: { symbol: '€', code: 'EUR' },
  AT: { symbol: '€', code: 'EUR' },
  IE: { symbol: '€', code: 'EUR' },
  FI: { symbol: '€', code: 'EUR' },
  GR: { symbol: '€', code: 'EUR' },
  BR: { symbol: 'R$', code: 'BRL' },
  GB: { symbol: '£', code: 'GBP' },
  US: { symbol: '$', code: 'USD' },
  CA: { symbol: 'CA$', code: 'CAD' },
  AU: { symbol: 'AU$', code: 'AUD' },
  NZ: { symbol: 'NZ$', code: 'NZD' },
  MX: { symbol: 'MX$', code: 'MXN' },
  AR: { symbol: 'AR$', code: 'ARS' },
  CL: { symbol: 'CL$', code: 'CLP' },
  CO: { symbol: 'CO$', code: 'COP' },
  PE: { symbol: 'S/', code: 'PEN' },
  JP: { symbol: '¥', code: 'JPY' },
  KR: { symbol: '₩', code: 'KRW' },
  CN: { symbol: '¥', code: 'CNY' },
  IN: { symbol: '₹', code: 'INR' },
  CH: { symbol: 'CHF', code: 'CHF' },
  SE: { symbol: 'kr', code: 'SEK' },
  NO: { symbol: 'kr', code: 'NOK' },
  DK: { symbol: 'kr', code: 'DKK' },
  PL: { symbol: 'zł', code: 'PLN' },
  CZ: { symbol: 'Kč', code: 'CZK' },
  HU: { symbol: 'Ft', code: 'HUF' },
  RO: { symbol: 'lei', code: 'RON' },
  TR: { symbol: '₺', code: 'TRY' },
  ZA: { symbol: 'R', code: 'ZAR' },
  SG: { symbol: 'S$', code: 'SGD' },
  AE: { symbol: 'AED', code: 'AED' },
  SA: { symbol: 'SAR', code: 'SAR' },
  IL: { symbol: '₪', code: 'ILS' },
};

export const getCurrencyInfo = (countryCode: string): CurrencyInfo => {
  return currencyMap[countryCode] || { symbol: '$', code: 'USD' };
};
