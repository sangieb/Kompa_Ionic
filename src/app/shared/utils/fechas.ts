const dos = (n: number): string => String(n).padStart(2, '0');

/** dd/MM/yyyy */
export function formatearFecha(ms: number): string {
  const d = new Date(ms);
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** dd/MM/yyyy HH:mm */
export function formatearFechaHora(ms: number): string {
  const d = new Date(ms);
  return `${formatearFecha(ms)} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** "2000-05-31" (lo que da el input date) → "31/05/2000" */
export function isoAFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Edad cumplida a partir de "yyyy-mm-dd". */
export function edadDesdeIso(iso: string, hoy = new Date()): number | null {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return calcularEdad(dia, mes, anio, hoy);
}

/** Edad cumplida a partir de "dd/MM/yyyy" (como se guarda en el perfil). */
export function edadDesdeFechaTexto(fecha: string, hoy = new Date()): number | null {
  const partes = fecha.split('/').map(Number);
  if (partes.length !== 3 || partes.some((n) => !Number.isFinite(n))) return null;
  const [dia, mes, anio] = partes;
  if (!anio || !mes || !dia) return null;
  return calcularEdad(dia, mes, anio, hoy);
}

/** Fecha de hace N años en formato "yyyy-mm-dd" (límite del input date). */
export function isoHaceAnios(anios: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anios);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Fecha y hora actual en "yyyy-MM-ddTHH:mm" (mínimo del input datetime-local). */
export function fechaHoraLocalAhora(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

function calcularEdad(dia: number, mes: number, anio: number, hoy: Date): number {
  let edad = hoy.getFullYear() - anio;
  const mesHoy = hoy.getMonth() + 1;
  if (mesHoy < mes || (mesHoy === mes && hoy.getDate() < dia)) edad--;
  return edad;
}
