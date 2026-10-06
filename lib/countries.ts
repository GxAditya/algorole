// ISO 3166-1 alpha-2 code → display name. Single source of truth for
// frontend dropdown and backend query fallback.
export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  IE: 'Ireland',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  ES: 'Spain',
  IT: 'Italy',
  PT: 'Portugal',
  SE: 'Sweden',
  CH: 'Switzerland',
  PL: 'Poland',
  IN: 'India',
  SG: 'Singapore',
  JP: 'Japan',
  KR: 'South Korea',
  AE: 'UAE',
  IL: 'Israel',
  BR: 'Brazil',
  MX: 'Mexico',
  ZA: 'South Africa',
  NZ: 'New Zealand',
};

export function countryName(code?: string): string {
  if (!code) return '';
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}
