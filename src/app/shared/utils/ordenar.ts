/**
 * Ordena una lista por fecha (más reciente primero) y desempata por nombre
 * (ascendente). Siempre devuelve una copia.
 */
export function ordenarPorFechaYNombre<T>(
  lista: T[],
  claveFecha: (item: T) => number | null,
  claveNombre: (item: T) => string,
): T[] {
  return [...lista].sort((a, b) => {
    const fa = claveFecha(a) ?? -Infinity;
    const fb = claveFecha(b) ?? -Infinity;
    if (fa !== fb) return fb - fa;
    return claveNombre(a).localeCompare(claveNombre(b));
  });
}
