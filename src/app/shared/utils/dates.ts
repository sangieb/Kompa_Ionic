const pad2 = (n: number): string => String(n).padStart(2, '0');

/** dd/MM/yyyy */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** dd/MM/yyyy HH:mm */
export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${formatDate(ms)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "2000-05-31" (from date input) -> "31/05/2000" */
export function isoToDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/** Age calculated from "yyyy-mm-dd". */
export function ageFromIso(iso: string, today = new Date()): number | null {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return null;
  return calculateAge(day, month, year, today);
}

/** Age calculated from "dd/MM/yyyy" (as stored in profile). */
export function ageFromDateText(dateText: string, today = new Date()): number | null {
  const parts = dateText.split('/').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [day, month, year] = parts;
  if (!year || !month || !day) return null;
  return calculateAge(day, month, year, today);
}

/** Date N years ago in "yyyy-mm-dd" format (limit for date input). */
export function isoYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Current local datetime in "yyyy-MM-ddTHH:mm" (minimum for datetime-local input). */
export function localDateTimeNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function calculateAge(day: number, month: number, year: number, today: Date): number {
  let age = today.getFullYear() - year;
  const currentMonth = today.getMonth() + 1;
  if (currentMonth < month || (currentMonth === month && today.getDate() < day)) age--;
  return age;
}

export const formatearFechaHora = formatDateTime;
export const isoAFecha = isoToDate;
export const edadDesdeIso = ageFromIso;
export const edadDesdeFechaTexto = ageFromDateText;
export const isoHaceAnios = isoYearsAgo;
export const fechaHoraLocalAhora = localDateTimeNow;
export const calcularEdad = calculateAge;
