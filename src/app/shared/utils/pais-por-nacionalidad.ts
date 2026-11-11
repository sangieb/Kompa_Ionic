/** Código ISO de país para las búsquedas de Nominatim (countrycodes). */
export function codigoPais(nacionalidad: string | null | undefined): string | null {
  const n = nacionalidad?.trim().toLowerCase();
  if (!n) return null;
  if (n.includes('mexicana')) return 'mx';
  if (n.includes('colombiana')) return 'co';
  if (n.includes('argentina')) return 'ar';
  if (n.includes('chilena')) return 'cl';
  if (n.includes('peruana')) return 'pe';
  if (n.includes('espa')) return 'es';
  if (n.includes('estadounidense')) return 'us';
  if (n.includes('brasile')) return 'br';
  if (n.includes('ecuatoriana')) return 'ec';
  return null;
}
