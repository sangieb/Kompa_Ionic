const NATIONALITY_TO_COUNTRY: Record<string, string> = {
  mexicana: 'mx',
  mexicano: 'mx',
  colombiana: 'co',
  colombiano: 'co',
  argentina: 'ar',
  argentino: 'ar',
  chilena: 'cl',
  chileno: 'cl',
  peruana: 'pe',
  peruano: 'pe',
  espa: 'es',
  estadounidense: 'us',
  brasile: 'br',
  ecuatoriana: 'ec',
  ecuatoriano: 'ec',
};

/** ISO country code for Nominatim geocoding searches (countrycodes). */
export function countryCode(nationality: string | null | undefined): string | null {
  const n = nationality?.trim().toLowerCase();
  if (!n) return null;
  for (const [key, code] of Object.entries(NATIONALITY_TO_COUNTRY)) {
    if (n.includes(key)) return code;
  }
  return null;
}
