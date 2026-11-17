/**
 * Sorts a list by date (most recent first) and breaks ties by name (ascending).
 * Always returns a copy.
 */
export function sortByDateAndName<T>(
  list: T[],
  dateKey: (item: T) => number | null,
  nameKey: (item: T) => string,
): T[] {
  return [...list].sort((a, b) => {
    const fa = dateKey(a) ?? -Infinity;
    const fb = dateKey(b) ?? -Infinity;
    if (fa !== fb) return fb - fa;
    return nameKey(a).localeCompare(nameKey(b));
  });
}
