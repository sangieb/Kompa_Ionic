const dos = (n: number) => String(n).padStart(2, '0');

/** dd/MM/yyyy, como FechaFormatos.fecha() */
export function formatearFecha(ms: number): string {
  const d = new Date(ms);
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** dd/MM/yyyy HH:mm, como FechaFormatos.fechaHora() */
export function formatearFechaHora(ms: number): string {
  const d = new Date(ms);
  return `${formatearFecha(ms)} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** "2000-05-31" (lo que da el input date) → "31/05/2000" */
export function isoAFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Edad cumplida a partir de "yyyy-mm-dd", como esMayorDeEdad() en Kotlin */
export function edadDesdeIso(iso: string, hoy = new Date()): number | null {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  let edad = hoy.getFullYear() - anio;
  const mesHoy = hoy.getMonth() + 1;
  if (mesHoy < mes || (mesHoy === mes && hoy.getDate() < dia)) edad--;
  return edad;
}

/** Fecha de hace N años en formato "yyyy-mm-dd" (límite del calendario) */
export function isoHaceAnios(anios: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anios);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}